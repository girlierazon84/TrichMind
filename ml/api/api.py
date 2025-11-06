#!/usr/bin/env python3
from __future__ import annotations
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional
import time
import io

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ml.common.config import MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, INFER_LOG_CSV, INFER_LOG_DIR, SCALER_PATH
from ml.common.transformers import ColumnSelector
from ml.common.risk import risk_from_score, LABELS


# ── CORS ─────────────────────────────────
ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# ── Globals ──────────────────────────────
model = None
label_encoder = None
feature_names: List[str] = []
scaler = None
MODEL_VERSION = "unknown"

# ── Schemas ──────────────────────────────
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

# ── Lifespan ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, label_encoder, feature_names, MODEL_VERSION, scaler
    for pth in [MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, SCALER_PATH]:
        if not pth.exists():
            raise RuntimeError(f"Missing artifact: {pth}")
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER)
    feature_names = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
    scaler = joblib.load(SCALER_PATH)
    MODEL_VERSION = MODEL_PATH.name
    INFER_LOG_DIR.mkdir(parents=True, exist_ok=True)
    yield

# ── App ─────────────────────────────────
app = FastAPI(title="TrichMind Relapse Risk API", version="5.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Helpers ──────────────────────────────

# Convert input(s) to feature DataFrame
def to_feature_frame(items: List[PredictIn] | PredictIn) -> pd.DataFrame:
    if isinstance(items, PredictIn):
        items = [items]
    df = pd.DataFrame([i.model_dump() for i in items])
    # Align & scale using persisted scaler
    df = ColumnSelector(feature_names).transform(df)
    # Ensure numeric and scale
    X = df.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    X[feature_names] = scaler.transform(X[feature_names])
    return X

# Get high probability from model
def get_high_probability(X: pd.DataFrame) -> np.ndarray:
    inner = model.named_steps.get("clf", model) if hasattr(model, "named_steps") else model
    if not hasattr(inner, "predict_proba"):
        preds = model.predict(X)
        # Map predicted class → probability proxy (1.0 for predicted high else 0)
        return (preds == LABELS.index("high")).astype(float)
    # columns already in encoder order (low, medium, high) due to training
    proba = inner.predict_proba(X)
    # high index is 2 as per LABELS order
    return proba[:, 2]

# Log inference to CSV
def log_inference(row: dict) -> None:
    hdr = ["timestamp","request_type","n_records","risk_score","risk_bucket","risk_code","confidence","n_features_used","model_version"]
    write_header = not INFER_LOG_CSV.exists()
    with open(INFER_LOG_CSV, "a", encoding="utf-8", newline="") as f:
        import csv
        w = csv.DictWriter(f, fieldnames=hdr)
        if write_header:
            w.writeheader()
        w.writerow(row)

# ── Endpoints ────────────────────────────
# Check API status
@app.get("/live")
def live():
    return {"status":"alive","version":MODEL_VERSION}

# Health check
@app.get("/healthz")
def healthz():
    ok = all([model is not None, label_encoder is not None, feature_names])
    return {"ok": bool(ok), "n_features": len(feature_names), "model_version": MODEL_VERSION}

# Single prediction
@app.post("/predict")
def predict(p: PredictIn):
    t0 = time.time()
    try:
        X = to_feature_frame(p)
        score = float(get_high_probability(X)[0]) # 0..1 high-risk prob
        rr = risk_from_score(score)
        out = {
            "risk_score": rr.score,
            "risk_bucket": rr.bucket,
            "risk_code": rr.code,
            "confidence": rr.confidence,
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
            "runtime_sec": round(time.time() - t0, 3)
        }
        # Log inference
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "single",
            "n_records": 1,
            "risk_score": rr.score,
            "risk_bucket": rr.bucket,
            "risk_code": rr.code,
            "confidence": rr.confidence,
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
        })
        return out
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Batch prediction
@app.post("/batch_predict")
def batch_predict(items: List[PredictIn]):
    t0 = time.time()
    try:
        X = to_feature_frame(items)
        scores = get_high_probability(X)
        preds = [risk_from_score(float(s)) for s in scores]
        out = [{"index": i, "risk_score": r.score, "risk_bucket": r.bucket, "risk_code": r.code, "confidence": r.confidence} for i, r in enumerate(preds)]
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "batch",
            "n_records": len(items),
            "risk_score": float(np.mean(scores)),
            "risk_bucket": "mixed",
            "risk_code": -1,
            "confidence": float(np.mean([r.confidence for r in preds])),
            "n_features_used": len(feature_names),
            "model_version": MODEL_VERSION,
        })
        return {"count": len(out), "predictions": out, "avg_runtime_sec": round(time.time() - t0, 3)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Batch prediction via CSV upload
@app.post("/batch_predict_csv")
async def batch_predict_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        records = [PredictIn(**row) for row in df.to_dict(orient="records")]
        return batch_predict(records)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")