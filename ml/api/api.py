#!/usr/bin/env python3
from __future__ import annotations
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional, Dict, Union
import time, io, sys, csv
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from common.config import (
    MODEL_PATH, LABEL_ENCODER, FEATURES_JSON,
    INFER_LOG_CSV, INFER_LOG_DIR, SCALER_PATH
)
from common.transformers import ColumnSelector
from common.risk import risk_from_score


# ──────────────────────────────
# 🛠️ Setup module path
# ──────────────────────────────
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[0]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

# ──────────────────────────────
# 🧠 TrichMind ML (API)
# ──────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5050",
    "http://localhost:5173"
]

# ──────────────────────────────
# Globals
# ──────────────────────────────
model = None
label_encoder = None
feature_names: List[str] = []
scaler = None
MODEL_VERSION = "unknown"

# Blend weight for the rules-vs-model score
ALPHA = 0.5  # 0 = pure model, 1 = pure rules

# ──────────────────────────────
# 🧩 Input schema for model
# ──────────────────────────────
class PredictIn(BaseModel):
    pulling_severity: float = Field(..., ge=0, le=10)
    pulling_frequency_encoded: int = Field(..., ge=0, le=5)
    awareness_level_encoded: float = Field(..., ge=0, le=1)
    how_long_stopped_days_est: float = Field(..., ge=0)
    successfully_stopped_encoded: int = Field(..., ge=0, le=1)
    years_since_onset: float = Field(..., ge=0)
    age: float = Field(..., ge=0)
    age_of_onset: float = Field(..., ge=0)
    emotion_intensity_sum: Optional[float] = 0.0
    anxiety_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    depression_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    coping_strategies_effective: Optional[int] = Field(default=0, ge=0, le=1)
    sleep_quality_score: Optional[float] = Field(default=5, ge=0, le=10)

# ──────────────────────────────
# 🧩 NEW: Friendly input schema
# ──────────────────────────────
class PredictFriendly(BaseModel):
    age: int = Field(..., ge=0, le=120)
    age_of_onset: int = Field(..., ge=0, le=120)
    years_since_onset: Optional[int] = Field(None, ge=0, le=120)
    pulling_severity: int = Field(..., ge=0, le=10)
    pulling_frequency: str
    pulling_awareness: str
    successfully_stopped: Union[bool, str]
    how_long_stopped_days: int = Field(..., ge=0)
    emotion: str

    @validator("pulling_frequency", "pulling_awareness", "emotion", pre=True)
    def _norm_lower(cls, v):
        return str(v).strip().lower() if v is not None else v

    @validator("successfully_stopped", pre=True)
    def _norm_boolish(cls, v):
        if isinstance(v, bool):
            return v
        s = str(v).strip().lower()
        if s in {"1", "true", "yes", "y"}:
            return True
        if s in {"0", "false", "no", "n"}:
            return False
        return False

# ──────────────────────────────────────
# 🧩 Maps for categorical encodings
# ──────────────────────────────────────
# Pulling frequency mapping
_FREQ_MAP = {
    "daily": 5,
    "several_times_a_week": 4,
    "weekly": 3,
    "monthly": 2,
    "rarely": 1,
}

# Pulling awareness mapping
_AWARE_MAP = {
    "yes": 1.0,
    "sometimes": 0.5,
    "no": 0.0,
}

# ────────────────────────────────────────────────────
# 🧩 Encoding function from friendly to model-ready
# ────────────────────────────────────────────────────
def _encode_friendly_to_encoded(p: PredictFriendly) -> PredictIn:
    """Convert user-friendly inputs to model-ready encoded payload."""
    freq_enc = _FREQ_MAP.get(p.pulling_frequency, 0)
    aware_enc = _AWARE_MAP.get(p.pulling_awareness, 0.0)
    stopped_enc = 1 if bool(p.successfully_stopped) else 0
    yso = p.years_since_onset
    if yso is None:
        yso = max(0, int(p.age) - int(p.age_of_onset))
    return PredictIn(
        pulling_severity=float(p.pulling_severity),
        pulling_frequency_encoded=int(freq_enc),
        awareness_level_encoded=float(aware_enc),
        how_long_stopped_days_est=float(p.how_long_stopped_days),
        successfully_stopped_encoded=int(stopped_enc),
        years_since_onset=float(yso),
        age=float(p.age),
        age_of_onset=float(p.age_of_onset),
        emotion_intensity_sum=0.0,
        anxiety_level=0.5,
        depression_level=0.5,
        coping_strategies_effective=0,
        sleep_quality_score=5.0,
    )


# ────────────────────────────────────────
# 🧬 Lifespan: Load model & artifacts
# ────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, label_encoder, feature_names, MODEL_VERSION, scaler
    for pth in [MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, SCALER_PATH]:
        if not Path(pth).exists():
            raise RuntimeError(f"Missing artifact: {pth}")
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER)
    feature_names = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
    scaler = joblib.load(SCALER_PATH)
    MODEL_VERSION = MODEL_PATH.name
    INFER_LOG_DIR.mkdir(parents=True, exist_ok=True)
    yield


# ──────────────────────────────
# 🛠️ FastAPI app & middleware
# ──────────────────────────────
app = FastAPI(title="TrichMind Relapse Risk API", version="6.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# 🛠️ Helpers - feature frame conversion
# ─────────────────────────────────────────
def to_feature_frame(items: List[PredictIn] | PredictIn) -> pd.DataFrame:
    if isinstance(items, PredictIn):
        items = [items]
    df_in = pd.DataFrame([i.model_dump() for i in items])
    X = ColumnSelector(feature_names).transform(df_in)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    X[feature_names] = scaler.transform(X[feature_names])
    return X

# ───────────────────────────────────────────────────────
# 🛠️ Scoring functions - get model inner and classes
# ───────────────────────────────────────────────────────
def get_model_inner_and_classes():
    inner = getattr(model, "named_steps", {}).get("clf", model)
    classes = getattr(inner, "classes_", None)
    if classes is None:
        classes = np.array([0, 1, 2], dtype=int)
    return inner, np.array(classes, dtype=int)

# ────────────────────────────────────────────────
# 🛠️ Scoring functions - model classes weights
# ────────────────────────────────────────────────
def build_weights_vector_from_model_classes(model_classes: np.ndarray) -> np.ndarray:
    uniq = np.unique(model_classes.astype(int))
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in model_classes], dtype=float)

# ─────────────────────────────────────────────
# 🛠️ Scoring functions - model weighted score
# ─────────────────────────────────────────────
def model_weighted_score(X: pd.DataFrame) -> np.ndarray:
    inner, model_classes = get_model_inner_and_classes()
    if hasattr(inner, "predict_proba"):
        proba = inner.predict_proba(X)
        weights = build_weights_vector_from_model_classes(model_classes)
        return proba @ weights
    preds = inner.predict(X).astype(int)
    uniq = np.unique(preds)
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in preds], dtype=float)

# ─────────────────────────────────────────────────────
# 🛠️ Scoring functions - rule-based score & blending
# ─────────────────────────────────────────────────────
def rule_based_score(p: PredictIn) -> float:
    sev = np.clip(p.pulling_severity / 10.0, 0.0, 1.0)
    freq = np.clip(p.pulling_frequency_encoded / 5.0, 0.0, 1.0)
    inv_aw = np.clip(1.0 - p.awareness_level_encoded, 0.0, 1.0)
    score = 0.6 * sev + 0.3 * freq + 0.1 * inv_aw
    return float(np.clip(score, 0.0, 1.0))

# ────────────────────────────────────────────────────────
# 🛠️ Scoring functions - final blending & confidence
# ────────────────────────────────────────────────────────
def final_score_from_blend(model_score: float, rule_score: float) -> float:
    return float(np.clip((1.0 - ALPHA) * model_score + ALPHA * rule_score, 0.0, 1.0))

# ───────────────────────────────────────────────
# 🛠️ Logging inference - confidence calculation
# ───────────────────────────────────────────────
def confidence_from_score(s: float) -> float:
    return float(min(1.0, abs(s - 0.5) * 2))

# ───────────────────────────────────────────────
# 🛠️ Logging inference - append to CSV log
# ───────────────────────────────────────────────
def log_inference(row: dict) -> None:
    hdr = [
        "timestamp", "request_type", "n_records",
        "risk_score", "risk_bucket", "risk_code", "confidence",
        "n_features_used", "model_version", "runtime_sec"
    ]
    INFER_LOG_CSV.parent.mkdir(parents=True, exist_ok=True)
    write_header = not INFER_LOG_CSV.exists()
    with open(INFER_LOG_CSV, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=hdr, extrasaction="ignore")
        if write_header:
            w.writeheader()
        w.writerow({k: row.get(k) for k in hdr})


# ──────────────────────────────
# 🚀 API Endpoints
# ──────────────────────────────
# Get live status
@app.get("/live")
def live():
    return {
        "status": "alive",
        "version": MODEL_VERSION,
        "scoring": f"blend(model={1 - ALPHA:.2f}, rule={ALPHA:.2f})"
    }

# Health check
@app.get("/healthz")
def healthz():
    ok = all([model is not None, label_encoder is not None, feature_names])
    return {"ok": bool(ok), "n_features": len(feature_names), "model_version": MODEL_VERSION}

# Predict endpoint
@app.post("/predict")
def predict(p: PredictIn):
    t0 = time.time()
    try:
        X = to_feature_frame(p)
        m_score = float(model_weighted_score(X)[0])
        r_score = rule_based_score(p)
        score = final_score_from_blend(m_score, r_score)
        rr = risk_from_score(score)
        rr_conf = confidence_from_score(score)

        runtime = round(time.time() - t0, 3)
        out = {
            "risk_score": round(score, 3),
            "risk_bucket": rr.bucket,
            "risk_code": rr.code,
            "confidence": round(rr_conf, 3),
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
            "runtime_sec": runtime,
            "debug": {"model_score": round(m_score, 3), "rule_score": round(r_score, 3), "alpha": ALPHA}
        }
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "single",
            "n_records": 1,
            **out
        })
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Predict endpoint with friendly inputs
@app.post("/predict_friendly")
def predict_friendly(p: PredictFriendly):
    """Accepts readable frontend inputs and encodes them internally."""
    encoded = _encode_friendly_to_encoded(p)
    return predict(encoded)

# Debug vector endpoint
@app.post("/debug_vector")
def debug_vector(p: PredictIn = Body(...)):
    """Peek at the transformed & scaled vector. Shows top non-zero/abs-valued features."""
    X = to_feature_frame(p)
    s = X.iloc[0]
    top = s.abs().sort_values(ascending=False).head(25)
    return {
        "n_features": len(s),
        "top_abs_features": [{ "name": k, "value": float(s[k]) } for k in top.index]
    }
