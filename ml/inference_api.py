#!/usr/bin/env python3
"""
✅ TrichMind ML Inference API — Relapse Risk Prediction (with Logging)

Provides:
    • /predict — Single relapse-risk prediction
    • /batch_predict — Multiple predictions (list)
    • /batch_predict_csv — CSV upload for batch inference
    • /live, /healthz — Service checks

Logs all predictions to:
    ml/artifacts/inference_outputs/logs/inference_log.csv
"""

from __future__ import annotations
import os
import io
import csv
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

# ──────────────────────────────
# Paths & Config
# ──────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(BASE_DIR, "artifacts", "training_outputs")
INFER_DIR = os.path.join(BASE_DIR, "artifacts", "inference_outputs")
LOG_DIR = os.path.join(INFER_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

MODEL_PATH = os.getenv(
    "MODEL_PATH",
    os.path.join(ML_DIR, "best_models", "best_relapse_risk_predictor_model.pkl")
)
ENCODER_PATH = os.getenv(
    "ENCODER_PATH",
    os.path.join(ML_DIR, "label_encoder", "label_encoder.pkl")
)
LOG_PATH = os.path.join(LOG_DIR, "inference_log.csv")

# Allow frontend origins
CORS_ENV = os.getenv("CORS_ORIGIN")
ALLOWED_ORIGINS: List[str] = (
    [o.strip() for o in CORS_ENV.split(",") if o.strip()]
    if CORS_ENV
    else ["http://localhost:5173", "http://127.0.0.1:5173"]
)

# ──────────────────────────────
# FastAPI Setup
# ──────────────────────────────
app = FastAPI(
    title="TrichMind Relapse Risk Predictor API",
    version="3.2.0",
    description="Predicts relapse risk probability for Trichotillomania patients using trained ML models.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
label_encoder = None

# ──────────────────────────────
# Input Schema
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
    emotion: Optional[str] = Field(default="unknown")
    anxiety_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    depression_level: Optional[float] = Field(default=0.5, ge=0, le=1)
    coping_strategies_effective: Optional[int] = Field(default=0, ge=0, le=1)
    sleep_quality_score: Optional[float] = Field(default=5, ge=0, le=10)

# ──────────────────────────────
# Helpers
# ──────────────────────────────
def encode_emotion(raw: str) -> float:
    """Encodes emotion string to numeric label using the trained encoder."""
    global label_encoder
    if not raw:
        raw = "unknown"
    try:
        return float(label_encoder.transform([raw])[0])
    except Exception:
        if "unknown" in getattr(label_encoder, "classes_", []):
            return float(label_encoder.transform(["unknown"])[0])
        return 0.0


def build_feature_frame(input_data: List[PredictIn] | PredictIn) -> pd.DataFrame:
    """Converts input objects (single or batch) to a DataFrame matching the trained model."""
    if isinstance(input_data, PredictIn):
        input_data = [input_data]

    rows = []
    for p in input_data:
        emo = encode_emotion(p.emotion)
        row = {
            "pulling_severity": p.pulling_severity,
            "pulling_frequency_encoded": p.pulling_frequency_encoded,
            "awareness_level_encoded": p.awareness_level_encoded,
            "how_long_stopped_days_est": p.how_long_stopped_days_est,
            "successfully_stopped_encoded": p.successfully_stopped_encoded,
            "years_since_onset": p.years_since_onset,
            "age": p.age,
            "age_of_onset": p.age_of_onset,
            "emotion_encoded": emo,
            "anxiety_level": p.anxiety_level,
            "depression_level": p.depression_level,
            "coping_strategies_effective": p.coping_strategies_effective,
            "sleep_quality_score": p.sleep_quality_score,
        }
        rows.append(row)

    X = pd.DataFrame(rows)
    for col in getattr(model, "feature_names_in_", []):
        if col not in X.columns:
            X[col] = 0.0
    return X[getattr(model, "feature_names_in_", X.columns)]

def log_inference(entry: dict):
    """Append a prediction entry to the inference log CSV."""
    header = [
        "timestamp",
        "request_type",
        "n_records",
        "risk_score",
        "risk_bucket",
        "confidence",
        "input_features",
    ]
    write_header = not os.path.exists(LOG_PATH)
    with open(LOG_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=header)
        if write_header:
            writer.writeheader()
        writer.writerow(entry)

# ──────────────────────────────
# Startup — Load Model
# ──────────────────────────────
@app.on_event("startup")
def _load_artifacts():
    """Load model and encoder at startup."""
    global model, label_encoder
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"MODEL_PATH not found: {MODEL_PATH}")
    if not os.path.exists(ENCODER_PATH):
        raise RuntimeError(f"ENCODER_PATH not found: {ENCODER_PATH}")

    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)

    print(f"[startup] ✅ Model loaded successfully")
    print(f" ├─ Model: {os.path.basename(MODEL_PATH)}")
    print(f" ├─ Features: {len(getattr(model, 'feature_names_in_', []))}")
    print(f" └─ Encoder: {os.path.basename(ENCODER_PATH)}")

# ──────────────────────────────
# Health Checks
# ──────────────────────────────
@app.get("/live")
def live():
    return {"status": "alive"}

@app.get("/healthz")
def healthz():
    if model is None:
        return {"ok": False, "error": "Model not loaded"}
    return {"ok": True, "features": len(getattr(model, "feature_names_in_", []))}

# ──────────────────────────────
# Single Prediction
# ──────────────────────────────
@app.post("/predict")
def predict(p: PredictIn):
    """Predict relapse-risk probability for one record."""
    try:
        X = build_feature_frame(p)
        relapse_prob = (
            float(model.predict_proba(X)[0, 1])
            if hasattr(model, "predict_proba")
            else float(model.predict(X)[0])
        )

        bucket = "high" if relapse_prob >= 0.7 else "medium" if relapse_prob >= 0.3 else "low"
        confidence = round(abs(relapse_prob - 0.5) * 2, 3)

        result = {
            "risk_score": round(relapse_prob, 3),
            "risk_bucket": bucket,
            "confidence": confidence,
            "n_features_used": len(X.columns),
        }

        # Log the inference
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "single",
            "n_records": 1,
            "risk_score": result["risk_score"],
            "risk_bucket": result["risk_bucket"],
            "confidence": result["confidence"],
            "input_features": str(X.to_dict(orient="records")[0]),
        })

        return result

    except Exception as e:
        print(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────
# Batch Prediction
# ──────────────────────────────
@app.post("/batch_predict")
def batch_predict(data: List[PredictIn]):
    """Accepts a list of records and returns relapse-risk predictions for each."""
    try:
        X = build_feature_frame(data)
        probs = (
            model.predict_proba(X)[:, 1]
            if hasattr(model, "predict_proba")
            else model.predict(X)
        )

        results = []
        for i, prob in enumerate(probs):
            bucket = "high" if prob >= 0.7 else "medium" if prob >= 0.3 else "low"
            confidence = round(abs(prob - 0.5) * 2, 3)
            results.append({
                "index": i,
                "risk_score": round(float(prob), 3),
                "risk_bucket": bucket,
                "confidence": confidence
            })

        # Log batch inference summary
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "batch",
            "n_records": len(data),
            "risk_score": np.mean(probs),
            "risk_bucket": "mixed",
            "confidence": np.mean([r["confidence"] for r in results]),
            "input_features": f"{len(data)} records",
        })

        return {"count": len(results), "predictions": results}

    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ──────────────────────────────
# CSV Upload Prediction
# ──────────────────────────────
@app.post("/batch_predict_csv")
async def batch_predict_csv(file: UploadFile = File(...)):
    """Upload a CSV for batch inference. Logs summary automatically."""
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        records = [PredictIn(**row) for row in df.to_dict(orient="records")]
        response = batch_predict(records)

        # Log CSV inference
        log_inference({
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "request_type": "csv",
            "n_records": len(records),
            "risk_score": np.mean([r["risk_score"] for r in response["predictions"]]),
            "risk_bucket": "mixed",
            "confidence": np.mean([r["confidence"] for r in response["predictions"]]),
            "input_features": f"CSV file: {file.filename}",
        })

        return response

    except Exception as e:
        print(f"❌ CSV batch prediction error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid CSV: {e}")
