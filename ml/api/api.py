#!/usr/bin/env python3
"""
ml/api/api.py - FastAPI app for TrichMind relapse risk prediction.
Implements endpoints for health checks and predictions using a
blended ML + rule-based model.

Usages:
    - GET /live : Liveness check
    - GET /healthz : Health check
    - POST /predict : Low-level prediction with encoded features
    - POST /predict_friendly : Friendly prediction with human-readable inputs
    - POST /predict_relapse_overview : Prediction using relapse overview schema
    - POST /debug_relapse_overview : Debug rule components for overview
    - POST /debug_vector : Debug feature vector details

Usage:
    uvicorn api.api:app --host 0.0.0.0
"""

from __future__ import annotations

import csv
import json
import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Union, Any

import joblib
import numpy as np
import pandas as pd
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------
#   🛠️ Setup module path FIRST
# ----------------------------
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[1]  # ✅ points to ml/
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

# ----------------------------
#   ✅ Pydantic v2/v1 safe import
# ----------------------------
try:
    from pydantic import BaseModel, Field, field_validator  # v2
except Exception:  # pragma: no cover
    from pydantic import BaseModel, Field, validator as field_validator  # type: ignore

# ----------------------------
#   ✅ Local imports (aligned)
# ----------------------------
from common.config import (
    FEATURES_JSON,
    INFER_LOG_CSV,
    INFER_LOG_DIR,
    LABEL_ENCODER,   # alias to LABEL_ENCODER_PATH in config
    MODEL_PATH,      # fallback path
    SCALER_PATH,
)
from common.model_registry import read_current_model_pointer
from common.risk_thresholds import risk_from_score
from common.column_selector import ColumnSelector

# Prefer your unified schema for relapse overview
try:
    from inference_schemas import RelapseFeatures  # ml/inference_schemas.py
except Exception:  # pragma: no cover
    RelapseFeatures = None  # type: ignore


# ------------------------------------
#   🧠 TrichMind ML (API) – CORS
# ------------------------------------
_frontend_env = (
    os.getenv("FASTAPI_CLIENT_URL")
    or os.getenv("CLIENT_URL")
    or "http://localhost:5050"
)

_default_cors = ",".join(
    [
        _frontend_env,
        "http://localhost:5050",
        "http://127.0.0.1:5050",
        "http://localhost:5173",
    ]
)

ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in os.getenv("FASTAPI_CORS_ORIGINS", _default_cors).split(",")
    if origin.strip()
]

print("🔐 [FastAPI CORS] Allowed origins:", ALLOWED_ORIGINS)

# --------------
#   Globals
# --------------
model: Any = None
label_encoder: Any = None
feature_names: List[str] = []
scaler: Any = None

MODEL_VERSION = "unknown"
ACTIVE_MODEL_PATH: Optional[Path] = None
ACTIVE_META: dict[str, Any] = {}

# Blend weight for the rules-vs-model score
# 0 = pure model, 1 = pure rules
ALPHA = float(os.getenv("TRICHMIND_ALPHA", "0.5"))


# -------------------------------------------
#   🧩 Input schema for low-level model
# -------------------------------------------
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

    # extended aggregates (used in RULE scoring; ML may ignore if not trained on them)
    avg_urge_7d: float = 0.0
    avg_urge_30d: float = 0.0
    max_urge_7d: float = 0.0
    high_urge_events_7d: float = 0.0

    avg_sleep_7d: float = 0.0
    short_sleep_nights_7d: float = 0.0

    avg_health_stress_7d: float = 0.0
    high_stress_days_7d: float = 0.0

    high_urge_and_high_stress_days_7d: float = 0.0


# ----------------------------------------------------
#   🧩 Friendly input schema (manual predictions)
# ----------------------------------------------------
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

    # pydantic v2 compatible
    @field_validator("pulling_frequency", "pulling_awareness", "emotion", mode="before")
    @classmethod
    def _norm_lower(cls, v):
        return str(v).strip().lower() if v is not None else v

    @field_validator("successfully_stopped", mode="before")
    @classmethod
    def _norm_boolish(cls, v):
        if isinstance(v, bool):
            return v
        s = str(v).strip().lower()
        if s in {"1", "true", "yes", "y"}:
            return True
        if s in {"0", "false", "no", "n"}:
            return False
        return False


# -----------------------------------------
#   🧩 Maps for categorical encodings
# -----------------------------------------
_FREQ_MAP = {
    "daily": 5,
    "several times a week": 4,
    "weekly": 3,
    "monthly": 2,
    "rarely": 1,
}
_AWARE_MAP = {"yes": 1.0, "sometimes": 0.5, "no": 0.0}


# ---------------------------------------
#   🧩 Simple normalization helpers
# ---------------------------------------
def _norm_simple(v: str | None) -> str:
    if v is None:
        return ""
    return " ".join(str(v).strip().lower().split())


def _normalize_frequency(raw: str | None) -> str:
    v = _norm_simple(raw)
    if not v:
        return ""
    if "several" in v and "week" in v:
        return "several times a week"
    if "every" in v and "day" in v:
        return "daily"
    if "day" in v:
        return "daily"
    if "week" in v:
        return "weekly"
    if "month" in v:
        return "monthly"
    if "rare" in v:
        return "rarely"
    return v


# ---------------------------------------------------------
#   🧩 Encoding helpers
# ---------------------------------------------------------
def _encode_friendly_to_encoded(p: PredictFriendly) -> PredictIn:
    freq_key = _normalize_frequency(p.pulling_frequency)
    freq_enc = _FREQ_MAP.get(freq_key, 0)

    aware_key = _norm_simple(p.pulling_awareness)
    aware_enc = _AWARE_MAP.get(aware_key, 0.0)

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


def _encode_relapse_features_to_encoded(p: Any) -> PredictIn:
    """
    Accepts RelapseFeatures (from inference_schemas.py) and converts to PredictIn.
    Keeps aggregates for rule scoring.
    """
    age = float(getattr(p, "age"))
    age_of_onset = float(getattr(p, "age_of_onset"))
    yso = getattr(p, "years_since_onset", None)
    if yso is None:
        yso = max(0.0, age - age_of_onset)

    # frequency & awareness (string -> encoding)
    freq_key = _normalize_frequency(getattr(p, "pulling_frequency", ""))
    freq_enc = _FREQ_MAP.get(freq_key, 0)

    aware_key = _norm_simple(getattr(p, "pulling_awareness", ""))
    aware_enc = _AWARE_MAP.get(aware_key, 0.0)

    stopped_val = getattr(p, "successfully_stopped", False)
    stopped_enc = 1 if bool(stopped_val) else 0

    return PredictIn(
        pulling_severity=float(getattr(p, "pulling_severity", 0.0)),
        pulling_frequency_encoded=int(freq_enc),
        awareness_level_encoded=float(aware_enc),
        how_long_stopped_days_est=float(getattr(p, "how_long_stopped_days", 0.0)),
        successfully_stopped_encoded=int(stopped_enc),
        years_since_onset=float(yso),
        age=float(age),
        age_of_onset=float(age_of_onset),

        # optional + safe defaults
        emotion_intensity_sum=0.0,

        # aggregates for rule scoring
        avg_urge_7d=float(getattr(p, "avg_urge_7d", 0.0) or 0.0),
        avg_urge_30d=float(getattr(p, "avg_urge_30d", 0.0) or 0.0),
        max_urge_7d=float(getattr(p, "max_urge_7d", 0.0) or 0.0),
        high_urge_events_7d=float(getattr(p, "high_urge_events_7d", 0.0) or 0.0),

        avg_sleep_7d=float(getattr(p, "avg_sleep_7d", 0.0) or 0.0),
        short_sleep_nights_7d=float(getattr(p, "short_sleep_nights_7d", 0.0) or 0.0),

        avg_health_stress_7d=float(getattr(p, "avg_health_stress_7d", 0.0) or 0.0),
        high_stress_days_7d=float(getattr(p, "high_stress_days_7d", 0.0) or 0.0),

        high_urge_and_high_stress_days_7d=float(
            getattr(p, "high_urge_and_high_stress_days_7d", 0.0) or 0.0
        ),
    )


# -------------------------------------------
#   🧠 Resolve active model from registry
# -------------------------------------------
def _resolve_active_model_path() -> tuple[Path, dict[str, Any]]:
    """
    Prefer models/current_model.json pointer.
    Fall back to MODEL_PATH from config if pointer missing.
    """
    pointer = read_current_model_pointer()
    if pointer and isinstance(pointer, dict):
        active = pointer.get("active") or {}
        path_str = active.get("path")
        if path_str:
            p = Path(path_str)
            if p.exists():
                return p, (pointer.get("meta") or {})
    return Path(MODEL_PATH), {}


# -------------------------------------------
#   🧬 Lifespan: Load model & artifacts
# -------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, label_encoder, feature_names, MODEL_VERSION, scaler, ACTIVE_MODEL_PATH, ACTIVE_META

    model_path, meta = _resolve_active_model_path()
    ACTIVE_MODEL_PATH = model_path
    ACTIVE_META = meta or {}

    artifacts = [model_path, Path(LABEL_ENCODER), Path(FEATURES_JSON), Path(SCALER_PATH)]
    missing = [str(p) for p in artifacts if not Path(p).exists()]

    if missing:
        print("❌ [ML startup] Missing artifacts:", missing, flush=True)
        print(f"📂 ACTIVE_MODEL_PATH = {model_path}", flush=True)
        print(f"📂 LABEL_ENCODER     = {LABEL_ENCODER}", flush=True)
        print(f"📂 FEATURES_JSON     = {FEATURES_JSON}", flush=True)
        print(f"📂 SCALER_PATH       = {SCALER_PATH}", flush=True)
        yield
        return

    print("✅ [ML startup] All artifacts found. Loading...", flush=True)

    model = joblib.load(model_path)
    label_encoder = joblib.load(LABEL_ENCODER)
    feature_names[:] = json.loads(Path(FEATURES_JSON).read_text(encoding="utf-8"))
    scaler = joblib.load(SCALER_PATH)

    MODEL_VERSION = model_path.name
    INFER_LOG_DIR.mkdir(parents=True, exist_ok=True)

    print(
        f"✅ [ML startup] Model loaded: {MODEL_VERSION}, {len(feature_names)} features",
        flush=True,
    )
    yield


# -----------------------------------
#   🛠️ FastAPI app & middleware
# -----------------------------------
app = FastAPI(
    title="TrichMind Relapse Risk API",
    version=os.getenv("TRICHMIND_API_VERSION", "6.3.1"),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------
#   🛠️ Helpers - feature frame conversion
# ---------------------------------------------
def to_feature_frame(items: List[PredictIn] | PredictIn) -> pd.DataFrame:
    if isinstance(items, PredictIn):
        items = [items]

    if scaler is None or not feature_names:
        raise RuntimeError("Model artifacts not loaded (scaler/features missing).")

    df_in = pd.DataFrame([i.model_dump() for i in items])

    # Ensure the model sees exactly the columns it expects
    X = ColumnSelector(feature_names).transform(df_in)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0.0)

    # Apply the same scaler used in preprocessing (fit on FEATURES_JSON columns)
    X[feature_names] = scaler.transform(X[feature_names])
    return X


# ----------------------------------------------------------
#   🛠️ Scoring functions - inner model & classes
# ----------------------------------------------------------
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
    uniq = np.unique(preds)
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in preds], dtype=float)


# ----------------------------------------------------------
#   🛠️ Rule components & score
# ----------------------------------------------------------
def rule_components(p: PredictIn) -> dict:
    sev = np.clip((p.pulling_severity or 0.0) / 10.0, 0.0, 1.0)
    freq = np.clip((p.pulling_frequency_encoded or 0.0) / 5.0, 0.0, 1.0)
    inv_aw = np.clip(1.0 - float(p.awareness_level_encoded or 0.0), 0.0, 1.0)

    avg_urge_7d = np.clip((p.avg_urge_7d or 0.0) / 10.0, 0.0, 1.0)
    avg_urge_30d = np.clip((p.avg_urge_30d or 0.0) / 10.0, 0.0, 1.0)
    recent_urge_spike = max(0.0, avg_urge_7d - avg_urge_30d)

    avg_sleep_7d_val = float(p.avg_sleep_7d or 0.0)
    low_sleep = 0.0 if avg_sleep_7d_val <= 0 else np.clip((6.0 - avg_sleep_7d_val) / 6.0, 0.0, 1.0)

    short_sleep_density = np.clip(float(p.short_sleep_nights_7d or 0.0) / 7.0, 0.0, 1.0)

    avg_stress_7d = np.clip((p.avg_health_stress_7d or 0.0) / 10.0, 0.0, 1.0)
    high_stress_density = np.clip(float(p.high_stress_days_7d or 0.0) / 7.0, 0.0, 1.0)

    combo_intensity = np.clip(float(p.high_urge_and_high_stress_days_7d or 0.0) / 3.0, 0.0, 1.0)

    days_stopped = float(p.how_long_stopped_days_est or 0.0)
    protection = np.clip(days_stopped / 90.0, 0.0, 1.0)

    score_raw = 0.0
    score_raw += 0.30 * sev
    score_raw += 0.15 * freq
    score_raw += 0.10 * inv_aw

    score_raw += 0.15 * avg_urge_7d
    score_raw += 0.05 * recent_urge_spike

    score_raw += 0.10 * low_sleep
    score_raw += 0.05 * short_sleep_density
    score_raw += 0.08 * avg_stress_7d
    score_raw += 0.07 * high_stress_density

    score_raw += 0.05 * combo_intensity
    score_raw -= 0.20 * protection

    score = float(np.clip(score_raw, 0.0, 1.0))
    return {
        "severity_norm": float(sev),
        "frequency_norm": float(freq),
        "inverse_awareness": float(inv_aw),
        "avg_urge_7d_norm": float(avg_urge_7d),
        "avg_urge_30d_norm": float(avg_urge_30d),
        "recent_urge_spike": float(recent_urge_spike),
        "low_sleep": float(low_sleep),
        "short_sleep_density": float(short_sleep_density),
        "avg_stress_7d_norm": float(avg_stress_7d),
        "high_stress_density": float(high_stress_density),
        "combo_intensity": float(combo_intensity),
        "protection_from_days_stopped": float(protection),
        "final_score_raw": float(score_raw),
        "final_score": float(score),
    }


def rule_based_score(p: PredictIn) -> float:
    return float(rule_components(p)["final_score"])


def final_score_from_blend(model_score: float, rule_score: float) -> float:
    return float(np.clip((1.0 - ALPHA) * model_score + ALPHA * rule_score, 0.0, 1.0))


def confidence_from_score(s: float) -> float:
    return float(min(1.0, abs(s - 0.5) * 2))


# ------------------------------------------------
#   🛠️ Logging inference - append to CSV log
# ------------------------------------------------
def log_inference(row: dict) -> None:
    hdr = [
        "timestamp",
        "request_type",
        "n_records",
        "risk_score",
        "risk_bucket",
        "risk_code",
        "confidence",
        "n_features_used",
        "model_version",
        "runtime_sec",
    ]
    INFER_LOG_CSV.parent.mkdir(parents=True, exist_ok=True)
    write_header = not INFER_LOG_CSV.exists()

    with open(INFER_LOG_CSV, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=hdr, extrasaction="ignore")
        if write_header:
            w.writeheader()
        w.writerow({k: row.get(k) for k in hdr})


# ------------------------------
#   🛠️ Core scoring helper
# ------------------------------
def _run_predict_core(p: PredictIn, request_type: str = "single") -> dict:
    t0 = time.time()
    try:
        X = to_feature_frame(p)
        m_score = float(model_weighted_score(X)[0])
        r_score = float(rule_based_score(p))
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
            "debug": {
                "model_score": round(m_score, 3),
                "rule_score": round(r_score, 3),
                "alpha": float(ALPHA),
            },
        }

        log_inference(
            {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "request_type": request_type,
                "n_records": 1,
                **out,
            }
        )
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------------
#   🚀 Liveness endpoint
# ----------------------------
@app.get("/live")
def live():
    return {
        "status": "alive",
        "version": MODEL_VERSION,
        "active_model_path": str(ACTIVE_MODEL_PATH) if ACTIVE_MODEL_PATH else "",
        "scoring": f"blend(model={1 - ALPHA:.2f}, rule={ALPHA:.2f})",
    }


# --------------------------------
#   🚀 Health check endpoint
# --------------------------------
@app.get("/healthz")
def healthz():
    ok = bool(model is not None and scaler is not None and feature_names)
    return {
        "ok": ok,
        "n_features": len(feature_names),
        "model_version": MODEL_VERSION,
    }


# ----------------------------------
#   🚀 Raw prediction endpoint
# ----------------------------------
@app.post("/predict")
def predict(p: PredictIn):
    """Low-level API: already-encoded numeric features."""
    return _run_predict_core(p, request_type="raw")


# ---------------------------------------
#   🚀 Friendly prediction endpoint
# ---------------------------------------
@app.post("/predict_friendly")
def predict_friendly(p: PredictFriendly):
    """Accepts readable frontend inputs and encodes them internally."""
    encoded = _encode_friendly_to_encoded(p)
    return _run_predict_core(encoded, request_type="friendly")


# ------------------------------------
#   🚀 Relapse overview endpoint (NEW updated payload)
# ------------------------------------
@app.post("/predict_relapse_overview")
def predict_relapse_overview(p: Any = Body(...)):
    """
    Accepts the NEW updated relapse overview payload (RelapseFeatures).
    If inference_schemas.RelapseFeatures is importable, FastAPI will validate it.
    Otherwise it will accept a dict body (still encoded safely).
    """
    # If schema is available, validate it
    if RelapseFeatures is not None and not isinstance(p, RelapseFeatures):
        p = RelapseFeatures(**p)

    encoded = _encode_relapse_features_to_encoded(p)
    return _run_predict_core(encoded, request_type="overview")


# --------------------------------------------------
#   🚀 Debug endpoint - rule components for overview
# --------------------------------------------------
@app.post("/debug_relapse_overview")
def debug_relapse_overview(p: Any = Body(...)):
    if RelapseFeatures is not None and not isinstance(p, RelapseFeatures):
        p = RelapseFeatures(**p)

    encoded = _encode_relapse_features_to_encoded(p)
    comps = rule_components(encoded)

    return {
        "rule_score": comps["final_score"],
        "raw_score": comps["final_score_raw"],
        "components": {k: v for k, v in comps.items() if k not in {"final_score", "final_score_raw"}},
    }


# --------------------------------------------------
#   🛠️ Debug endpoint - peek at feature vector
# --------------------------------------------------
@app.post("/debug_vector")
def debug_vector(p: PredictIn = Body(...)):
    X = to_feature_frame(p)
    s = X.iloc[0]
    top = s.abs().sort_values(ascending=False).head(25)
    return {
        "n_features": len(s),
        "top_abs_features": [{"name": k, "value": float(s[k])} for k in top.index],
    }
