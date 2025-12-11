#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Union

import joblib
import numpy as np
import pandas as pd
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

from common.config import (
    FEATURES_JSON,
    INFER_LOG_CSV,
    INFER_LOG_DIR,
    LABEL_ENCODER,
    MODEL_PATH,
    SCALER_PATH,
)
from common.risk import risk_from_score
from common.transformers import ColumnSelector


# ----------------------------
#   🛠️ Setup module path
# ----------------------------
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[0]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

# ------------------------------------
#   🧠 TrichMind ML (API) – CORS
# ------------------------------------

# Try to infer the main frontend URL from env (similar to Node)
_frontend_env = (
    os.getenv("FASTAPI_CLIENT_URL")
    or os.getenv("CLIENT_URL")
    or "http://localhost:5050"
)

_default_cors = ",".join(
    [
        # Main frontend (prod or local)
        _frontend_env,
        # Common local dev ports
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
model = None
label_encoder = None
feature_names: List[str] = []
scaler = None
MODEL_VERSION = "unknown"

# Blend weight for the rules-vs-model score
# 0 = pure model, 1 = pure rules
ALPHA = 0.5


# -------------------------------------------
#   🧩 Input schema for low-level model
# -------------------------------------------
class PredictIn(BaseModel):
    # core manual features
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

    # 🔹 extended features from journal/health – optional, default 0
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


# -----------------------------------------------
#   🧩 Extended schema for relapse overview
#   (profile + journal + health aggregates)
# -----------------------------------------------
class RelapseOverviewFeatures(PredictFriendly):
    """
    Extended relapse overview payload:
    - Inherits the core profile fields from PredictFriendly
    - Adds journal + health aggregates built in the Node service
    """
    # Journal – urges
    avg_urge_7d: float = 0.0
    avg_urge_30d: float = 0.0
    max_urge_7d: float = 0.0
    high_urge_events_7d: float = 0.0

    num_journal_entries_7d: int = 0
    num_journal_entries_30d: int = 0
    days_since_last_entry: int = Field(999, ge=0)

    # Journal – moods
    pct_stress_moods_30d: float = 0.0
    pct_calm_moods_30d: float = 0.0
    pct_happy_moods_30d: float = 0.0

    # Journal – triggers
    count_trigger_stress_30d: int = 0
    count_trigger_boredom_30d: int = 0
    count_trigger_anxiety_30d: int = 0
    count_trigger_fatigue_30d: int = 0
    count_trigger_bodyfocus_30d: int = 0
    count_trigger_screentime_30d: int = 0
    count_trigger_social_30d: int = 0
    count_trigger_other_30d: int = 0

    # Health – sleep
    avg_sleep_7d: float = 0.0
    avg_sleep_30d: float = 0.0
    min_sleep_7d: float = 0.0
    short_sleep_nights_7d: int = 0

    # Health – stress
    avg_health_stress_7d: float = 0.0
    avg_health_stress_30d: float = 0.0
    max_health_stress_7d: float = 0.0
    high_stress_days_7d: int = 0

    # Health – exercise
    avg_exercise_7d: float = 0.0
    avg_exercise_30d: float = 0.0
    days_with_any_exercise_7d: int = 0
    num_health_logs_7d: int = 0
    num_health_logs_30d: int = 0
    days_since_last_health_log: int = Field(999, ge=0)

    # Combined
    high_urge_and_high_stress_days_7d: int = 0


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

_AWARE_MAP = {
    "yes": 1.0,
    "sometimes": 0.5,
    "no": 0.0,
}


# ---------------------------------------
#   🧩 Simple normalization helpers
# ---------------------------------------
def _norm_simple(v: str | None) -> str:
    """Lowercase, strip, and collapse whitespace."""
    if v is None:
        return ""
    return " ".join(str(v).strip().lower().split())


def _normalize_frequency(raw: str | None) -> str:
    """
    Normalize free-text frequency answers into canonical keys
    used by _FREQ_MAP.
    """
    v = _norm_simple(raw)
    if not v:
        return ""

    # Handle common variations
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

    # Fallback: use normalized text as-is
    return v


# ---------------------------------------------------------
#   🧩 Encoding function from friendly to model-ready
# ---------------------------------------------------------
def _encode_friendly_to_encoded(p: PredictFriendly) -> PredictIn:
    """Convert user-friendly inputs to model-ready encoded payload."""
    # Frequency & awareness
    freq_key = _normalize_frequency(p.pulling_frequency)
    freq_enc = _FREQ_MAP.get(freq_key, 0)

    aware_key = _norm_simple(p.pulling_awareness)
    aware_enc = _AWARE_MAP.get(aware_key, 0.0)

    # Stopped flag
    stopped_enc = 1 if bool(p.successfully_stopped) else 0

    # Years since onset
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


def _encode_overview_to_encoded(p: RelapseOverviewFeatures) -> PredictIn:
    """
    Convert extended relapse overview payload into PredictIn,
    preserving the journal/health aggregates for the rule-based score.
    """
    base = _encode_friendly_to_encoded(p)
    data = base.model_dump()

    # pass through the aggregates (they are defined on PredictIn)
    data.update(
        avg_urge_7d=float(p.avg_urge_7d or 0.0),
        avg_urge_30d=float(p.avg_urge_30d or 0.0),
        max_urge_7d=float(p.max_urge_7d or 0.0),
        high_urge_events_7d=float(p.high_urge_events_7d or 0.0),
        avg_sleep_7d=float(p.avg_sleep_7d or 0.0),
        short_sleep_nights_7d=float(p.short_sleep_nights_7d or 0.0),
        avg_health_stress_7d=float(p.avg_health_stress_7d or 0.0),
        high_stress_days_7d=float(p.high_stress_days_7d or 0.0),
        high_urge_and_high_stress_days_7d=float(
            p.high_urge_and_high_stress_days_7d or 0.0
        ),
    )

    return PredictIn(**data)


# -------------------------------------------
#   🧬 Lifespan: Load model & artifacts
# -------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, label_encoder, feature_names, MODEL_VERSION, scaler

    for pth in [MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, SCALER_PATH]:
        if not Path(pth).exists():
            raise RuntimeError(f"Missing artifact: {pth}")

    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER)
    feature_names[:] = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
    scaler = joblib.load(SCALER_PATH)
    MODEL_VERSION = MODEL_PATH.name

    INFER_LOG_DIR.mkdir(parents=True, exist_ok=True)

    yield


# -----------------------------------
#   🛠️ FastAPI app & middleware
# -----------------------------------
app = FastAPI(
    title="TrichMind Relapse Risk API",
    version="6.3.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # allow all *.vercel.app preview URLs
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

    df_in = pd.DataFrame([i.model_dump() for i in items])
    X = ColumnSelector(feature_names).transform(df_in)
    X = X.apply(pd.to_numeric, errors="coerce").fillna(0.0)

    # Apply the same scaler as used in training
    X[feature_names] = scaler.transform(X[feature_names])
    return X


# ----------------------------------------------------------
#   🛠️ Scoring functions - get model inner and classes
# ----------------------------------------------------------
def get_model_inner_and_classes():
    inner = getattr(model, "named_steps", {}).get("clf", model)
    classes = getattr(inner, "classes_", None)
    if classes is None:
        classes = np.array([0, 1, 2], dtype=int)
    return inner, np.array(classes, dtype=int)


# ----------------------------------------------------
#   🛠️ Scoring functions - model classes weights
# ----------------------------------------------------
def build_weights_vector_from_model_classes(
    model_classes: np.ndarray,
) -> np.ndarray:
    uniq = np.unique(model_classes.astype(int))
    ranks = {c: i for i, c in enumerate(np.sort(uniq))}
    base = [1.0] if len(uniq) == 1 else np.linspace(0.0, 1.0, num=len(uniq))
    lookup = {c: float(base[ranks[c]]) for c in uniq}
    return np.array([lookup[int(c)] for c in model_classes], dtype=float)


# ---------------------------------------------------
#   🛠️ Scoring functions - model weighted score
# ---------------------------------------------------
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
#   🛠️ Scoring functions - rule components & score
# ----------------------------------------------------------
def rule_components(p: PredictIn) -> dict:
    """
    Break down the heuristic into human-readable components
    so the UI can explain *why* the relapse risk is what it is.
    """

    # ---- Core behaviour ----------------------------------
    sev = np.clip((p.pulling_severity or 0.0) / 10.0, 0.0, 1.0)
    freq = np.clip((p.pulling_frequency_encoded or 0.0) / 5.0, 0.0, 1.0)
    inv_aw = np.clip(1.0 - float(p.awareness_level_encoded or 0.0), 0.0, 1.0)

    # ---- Journal: urges (0–10 → 0–1) --------------------
    avg_urge_7d = np.clip((p.avg_urge_7d or 0.0) / 10.0, 0.0, 1.0)
    avg_urge_30d = np.clip((p.avg_urge_30d or 0.0) / 10.0, 0.0, 1.0)
    recent_urge_spike = max(0.0, avg_urge_7d - avg_urge_30d)  # 0–1

    # ---- Health: sleep & stress -------------------------
    avg_sleep_7d_val = float(p.avg_sleep_7d or 0.0)
    # low sleep → higher risk; anything below 6h ramps up
    if avg_sleep_7d_val <= 0:
        low_sleep = 0.0
    else:
        low_sleep = np.clip((6.0 - avg_sleep_7d_val) / 6.0, 0.0, 1.0)

    short_sleep_nights_7d_val = float(p.short_sleep_nights_7d or 0.0)
    short_sleep_density = np.clip(short_sleep_nights_7d_val / 7.0, 0.0, 1.0)

    avg_stress_7d = np.clip((p.avg_health_stress_7d or 0.0) / 10.0, 0.0, 1.0)
    high_stress_days_7d_val = float(p.high_stress_days_7d or 0.0)
    high_stress_density = np.clip(high_stress_days_7d_val / 7.0, 0.0, 1.0)

    # ---- Combined: high urge AND high stress days -------
    combo_days = float(p.high_urge_and_high_stress_days_7d or 0.0)
    combo_intensity = np.clip(combo_days / 3.0, 0.0, 1.0)  # cap at 3 days

    # ---- Protective factor: how long stopped ------------
    days_stopped = float(p.how_long_stopped_days_est or 0.0)
    # up to ~3 months gives maximal protection
    protection = np.clip(days_stopped / 90.0, 0.0, 1.0)

    # ---- Weighted sum -----------------------------------
    score_raw = 0.0
    # Base trich behaviour
    score_raw += 0.30 * sev
    score_raw += 0.15 * freq
    score_raw += 0.10 * inv_aw

    # Urges
    score_raw += 0.15 * avg_urge_7d
    score_raw += 0.05 * recent_urge_spike

    # Sleep & stress
    score_raw += 0.10 * low_sleep
    score_raw += 0.05 * short_sleep_density
    score_raw += 0.08 * avg_stress_7d
    score_raw += 0.07 * high_stress_density

    # Combined bad days
    score_raw += 0.05 * combo_intensity

    # Protection: reduce risk based on abstinence time
    score_raw -= 0.20 * protection

    score_clamped = float(np.clip(score_raw, 0.0, 1.0))

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
        "final_score": score_clamped,
    }


def rule_based_score(p: PredictIn) -> float:
    """
    Heuristic score in [0, 1] using:
        - pulling severity / frequency / awareness
        - recent urge intensity (7d vs 30d)
        - recent sleep + stress (7d)
        - high-urge+high-stress combo days
        - protection from how long they've stayed stopped
    """
    comps = rule_components(p)
    return comps["final_score"]


# ----------------------------------------------------------
#   🛠️ Scoring functions - final blending & confidence
# ----------------------------------------------------------
def final_score_from_blend(model_score: float, rule_score: float) -> float:
    return float(
        np.clip((1.0 - ALPHA) * model_score + ALPHA * rule_score, 0.0, 1.0)
    )


# ----------------------------------------------------
#   🛠️ Scoring functions - confidence from score
# ----------------------------------------------------
def confidence_from_score(s: float) -> float:
    """Simple confidence: distance from 0.5."""
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
        r_score = rule_based_score(p)
        score = final_score_from_blend(m_score, r_score)
        rr = risk_from_score(score)
        rr_conf = confidence_from_score(score)

        runtime = round(time.time() - t0, 3)
        out = {
            "risk_score": round(score, 3),
            "risk_bucket": rr.bucket,   # always "low" | "medium" | "high"
            "risk_code": rr.code,
            "confidence": round(rr_conf, 3),
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
            "runtime_sec": runtime,
            "debug": {
                "model_score": round(m_score, 3),
                "rule_score": round(r_score, 3),
                "alpha": ALPHA,
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


# -----------------------------------------------------------------------------------------------------------
#   🚀 API Endpoints - Live, healthz, predict, predict_friendly, predict_relapse_overview, debug_vector, debug_relapse_overview
# -----------------------------------------------------------------------------------------------------------

# ----------------------------
#   🚀 Liveness endpoint
# ----------------------------
@app.get("/live")
def live():
    return {
        "status": "alive",
        "version": MODEL_VERSION,
        "scoring": f"blend(model={1 - ALPHA:.2f}, rule={ALPHA:.2f})",
    }


# --------------------------------
#   🚀 Health check endpoint
# --------------------------------
@app.get("/healthz")
def healthz():
    ok = all([model is not None, label_encoder is not None, feature_names])
    return {
        "ok": bool(ok),
        "n_features": len(feature_names),
        "model_version": MODEL_VERSION,
    }


# ----------------------------------
#   🚀 Raw prediction endpoint
# ----------------------------------
@app.post("/predict")
def predict(p: PredictIn):
    """Low-level API: already-encoded features."""
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
#   🚀 Relapse overview endpoint
# ------------------------------------
@app.post("/predict_relapse_overview")
def predict_relapse_overview(p: RelapseOverviewFeatures):
    """
    Relapse overview endpoint.
    Accepts extended features (profile + journal + health).
    Uses those extended features in the rule-based scoring,
    while the ML model still uses its trained feature set.
    """
    encoded = _encode_overview_to_encoded(p)
    return _run_predict_core(encoded, request_type="overview")


# --------------------------------------------------
#   🚀 Debug endpoint - rule components for overview
# --------------------------------------------------
@app.post("/debug_relapse_overview")
def debug_relapse_overview(p: RelapseOverviewFeatures):
    """
    Debug endpoint:
    - Same payload as /predict_relapse_overview
    - Returns only the rule-based heuristic breakdown
        so the UI can say 'why' the score looks like this.
    """
    encoded = _encode_overview_to_encoded(p)
    comps = rule_components(encoded)

    return {
        "rule_score": comps["final_score"],
        "raw_score": comps["final_score_raw"],
        "components": {
            k: v
            for k, v in comps.items()
            if k not in {"final_score", "final_score_raw"}
        },
    }


# --------------------------------------------------
#   🛠️ Debug endpoint - peek at feature vector
# --------------------------------------------------
@app.post("/debug_vector")
def debug_vector(p: PredictIn = Body(...)):
    """
    Peek at the transformed & scaled vector.
    Shows top features by absolute value.
    """
    X = to_feature_frame(p)
    s = X.iloc[0]
    top = s.abs().sort_values(ascending=False).head(25)
    return {
        "n_features": len(s),
        "top_abs_features": [
            {"name": k, "value": float(s[k])} for k in top.index
        ],
    }
