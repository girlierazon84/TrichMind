#!/usr/bin/env python3
from __future__ import annotations
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional, Dict
import time, io, sys, csv
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Path setup
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[0]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from common.config import (
    MODEL_PATH, LABEL_ENCODER, FEATURES_JSON,
    INFER_LOG_CSV, INFER_LOG_DIR, SCALER_PATH
)
from common.transformers import ColumnSelector
from common.risk import risk_from_score

ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# ── Globals
model = None
label_encoder = None
feature_names: List[str] = []
scaler = None
MODEL_VERSION = "unknown"

# Blend weight for the rules-vs-model score
ALPHA = 0.5  # 0 = pure model, 1 = pure rules

# ── Schema
class PredictIn(BaseModel):
    pulling_severity: float = Field(..., ge=0, le=10)
    pulling_frequency_encoded: int = Field(..., ge=0, le=5)
    awareness_level_encoded: float = Field(..., ge=0, le=1)
    how_long_stopped_days_est: float = Field(..., ge=0)
    successfully_stopped_encoded: int = Field(..., ge=0, le=1)
    years_since_onset: float = Field(..., ge=0)
    age: float = Field(..., ge=0)
    age_of_onset: float = Field(..., ge=0)
    # Optional extras (ignored if not in features)
    emotion_intensity_sum: Optional[float] = 0.0
    anxiety_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    depression_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    coping_strategies_effective: Optional[int] = Field(default=0, ge=0, le=1)
    sleep_quality_score: Optional[float] = Field(default=5, ge=0, le=10)

# ── Lifespan
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

# ── App
app = FastAPI(title="TrichMind Relapse Risk API", version="6.3.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Helpers
def to_feature_frame(items: List[PredictIn] | PredictIn) -> pd.DataFrame:
    if isinstance(items, PredictIn):
        items = [items]
    df_in = pd.DataFrame([i.model_dump() for i in items])
    X = ColumnSelector(feature_names).transform(df_in)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    X[feature_names] = scaler.transform(X[feature_names])
    return X

def get_model_inner_and_classes():
    inner = getattr(model, "named_steps", {}).get("clf", model)
    classes = getattr(inner, "classes_", None)
    if classes is None:
        classes = np.array([0, 1, 2], dtype=int)
    return inner, np.array(classes, dtype=int)

def build_weights_vector_from_model_classes(model_classes: np.ndarray) -> np.ndarray:
    uniq = np.unique(model_classes.astype(int))
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in model_classes], dtype=float)

def model_weighted_score(X: pd.DataFrame) -> np.ndarray:
    inner, model_classes = get_model_inner_and_classes()
    if hasattr(inner, "predict_proba"):
        proba = inner.predict_proba(X)
        weights = build_weights_vector_from_model_classes(model_classes)
        return proba @ weights
    preds = inner.predict(X).astype(int)
    # map predicted numeric class via rank weights
    uniq = np.unique(preds)
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in preds], dtype=float)

def rule_based_score(p: PredictIn) -> float:
    """
    Transparent rule:
        severity (0..10), frequency (0..5), awareness (0..1)
    Higher severity + frequency increase risk; higher awareness reduces risk.
    Tunable weights: sev 0.6, freq 0.3, awareness 0.1 (inverted).
    """
    sev = np.clip(p.pulling_severity / 10.0, 0.0, 1.0)
    freq = np.clip(p.pulling_frequency_encoded / 5.0, 0.0, 1.0)
    inv_aw = np.clip(1.0 - p.awareness_level_encoded, 0.0, 1.0)
    score = 0.6 * sev + 0.3 * freq + 0.1 * inv_aw
    return float(np.clip(score, 0.0, 1.0))

def final_score_from_blend(model_score: float, rule_score: float) -> float:
    return float(np.clip((1.0 - ALPHA) * model_score + ALPHA * rule_score, 0.0, 1.0))

def confidence_from_score(s: float) -> float:
    # farther from 0.5 = more confident; linear ramp
    return float(min(1.0, abs(s - 0.5) * 2))

def log_inference(row: dict) -> None:
    hdr = [
        "timestamp","request_type","n_records",
        "risk_score","risk_bucket","risk_code","confidence",
        "n_features_used","model_version","runtime_sec"
    ]
    INFER_LOG_CSV.parent.mkdir(parents=True, exist_ok=True)
    write_header = not INFER_LOG_CSV.exists()
    with open(INFER_LOG_CSV, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=hdr, extrasaction="ignore")
        if write_header:
            w.writeheader()
        w.writerow({k: row.get(k) for k in hdr})

# ── Endpoints
@app.get("/live")
def live():
    return {"status": "alive", "version": MODEL_VERSION, "scoring": f"blend(model={1-ALPHA:.2f}, rule={ALPHA:.2f})"}

@app.get("/healthz")
def healthz():
    ok = all([model is not None, label_encoder is not None, feature_names])
    return {"ok": bool(ok), "n_features": len(feature_names), "model_version": MODEL_VERSION}

@app.post("/predict")
def predict(p: PredictIn):
    t0 = time.time()
    try:
        X = to_feature_frame(p)
        m_score = float(model_weighted_score(X)[0])
        r_score = rule_based_score(p)
        score = final_score_from_blend(m_score, r_score)
        rr = risk_from_score(score)
        # override confidence with continuous confidence
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
            "debug": {
                "model_score": round(m_score, 3),
                "rule_score": round(r_score, 3),
                "alpha": ALPHA
            }
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

@app.post("/batch_predict")
def batch_predict(items: List[PredictIn]):
    t0 = time.time()
    try:
        X = to_feature_frame(items)
        m_scores = model_weighted_score(X)
        r_scores = np.array([rule_based_score(p) for p in items], dtype=float)
        scores = (1.0 - ALPHA) * m_scores + ALPHA * r_scores
        scores = np.clip(scores, 0.0, 1.0)

        preds = [risk_from_score(float(s)) for s in scores]
        outs = []
        for i, (s, r) in enumerate(zip(scores, preds)):
            outs.append({
                "index": i,
                "risk_score": round(float(s), 3),
                "risk_bucket": r.bucket,
                "risk_code": r.code,
                "confidence": round(confidence_from_score(float(s)), 3)
            })

        runtime = round(time.time() - t0, 3)
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "batch",
            "n_records": len(items),
            "risk_score": float(np.mean(scores)),
            "risk_bucket": "mixed",
            "risk_code": -1,
            "confidence": float(np.mean([o["confidence"] for o in outs])),
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
            "runtime_sec": runtime
        })
        return {"count": len(outs), "predictions": outs, "avg_runtime_sec": runtime}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch_predict_csv")
async def batch_predict_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        records = [PredictIn(**row) for row in df.to_dict(orient="records")]
        return batch_predict(records)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")

@app.post("/debug_model")
def debug_model(p: PredictIn = Body(...)):
    X = to_feature_frame(p)
    inner, model_classes = get_model_inner_and_classes()
    weights_vec = build_weights_vector_from_model_classes(model_classes)
    m_score = float(model_weighted_score(X)[0])
    r_score = rule_based_score(p)
    return {
        "model_version": MODEL_VERSION,
        "feature_count": len(feature_names),
        "model_classes": list(map(int, model_classes)),
        "weights_in_model_proba_order": list(map(float, weights_vec)),
        "model_weighted_score": m_score,
        "rule_score": r_score,
        "alpha": ALPHA,
        "final_weighted_score": final_score_from_blend(m_score, r_score)
    }

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
