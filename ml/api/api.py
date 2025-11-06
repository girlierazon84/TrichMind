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
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import sys

# Ensure we can import ml/common when running from repo root or /ml
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[0]  # ml/
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from common.config import MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, INFER_LOG_CSV, INFER_LOG_DIR, SCALER_PATH
from common.transformers import ColumnSelector
from common.risk import risk_from_score, LABELS

ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

model = None
label_encoder = None
feature_names: List[str] = []
scaler = None
MODEL_VERSION = "unknown"

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

app = FastAPI(title="TrichMind Relapse Risk API", version="5.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def to_feature_frame(items: List[PredictIn] | PredictIn) -> pd.DataFrame:
    if isinstance(items, PredictIn):
        items = [items]
    df = pd.DataFrame([i.model_dump() for i in items])
    df = ColumnSelector(feature_names).transform(df)
    X = df.apply(pd.to_numeric, errors="coerce").fillna(0.0)
    X[feature_names] = scaler.transform(X[feature_names])
    return X

def get_high_probability(X: pd.DataFrame) -> np.ndarray:
    inner = getattr(model, "named_steps", {}).get("clf", model)
    if not hasattr(inner, "predict_proba"):
        preds = model.predict(X)
        return (preds == LABELS.index("high")).astype(float)
    proba = inner.predict_proba(X)
    high_idx = list(label_encoder.classes_).index("high") if "high" in label_encoder.classes_ else -1
    if high_idx == -1:
        # fallback: assume ['low','medium','high'] order
        high_idx = 2 if proba.shape[1] >= 3 else proba.shape[1]-1
    return proba[:, high_idx]

def log_inference(row: dict) -> None:
    hdr = ["timestamp","request_type","n_records","risk_score","risk_bucket","risk_code",
            "confidence","n_features_used","model_version"]
    write_header = not INFER_LOG_CSV.exists()
    INFER_LOG_CSV.parent.mkdir(parents=True, exist_ok=True)
    import csv
    with open(INFER_LOG_CSV, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=hdr)
        if write_header: w.writeheader()
        w.writerow(row)

@app.get("/live")
def live():
    return {"status":"alive","version":MODEL_VERSION}

@app.get("/healthz")
def healthz():
    ok = all([model is not None, label_encoder is not None, feature_names])
    return {"ok": bool(ok), "n_features": len(feature_names), "model_version": MODEL_VERSION}

@app.post("/predict")
def predict(p: PredictIn):
    t0 = time.time()
    try:
        X = to_feature_frame(p)
        score = float(get_high_probability(X)[0])
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

@app.post("/batch_predict")
def batch_predict(items: List[PredictIn]):
    t0 = time.time()
    try:
        X = to_feature_frame(items)
        scores = get_high_probability(X)
        preds = [risk_from_score(float(s)) for s in scores]
        out = [{"index": i, "risk_score": r.score, "risk_bucket": r.bucket,
                "risk_code": r.code, "confidence": r.confidence} for i, r in enumerate(preds)]
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

@app.post("/batch_predict_csv")
async def batch_predict_csv(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        records = [PredictIn(**row) for row in df.to_dict(orient="records")]
        return batch_predict(records)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")
