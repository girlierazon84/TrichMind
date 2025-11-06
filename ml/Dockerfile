# ──────────────────────────────
# 🧠 TrichMind ML Inference API — Dockerfile
# ──────────────────────────────
FROM python:3.13-slim AS base


WORKDIR /app

# Environment setup
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Stockholm \
    MODEL_PATH=/app/ml/artifacts/training_outputs/best_models/best_relapse_risk_predictor_model.pkl \
    ENCODER_PATH=/app/ml/artifacts/training_outputs/label_encoder/label_encoder.pkl \
    SCALER_PATH=/app/ml/artifacts/preprocessed_outputs/scaler_model/scaler.pkl \
    FEATURES_PATH=/app/ml/artifacts/preprocessed_outputs/metadata/features.json \
    PORT=8000


# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && rm -rf /var/lib/apt/lists/*


# Copy and install Python dependencies
COPY ml/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# Copy full project
COPY . .


# Healthcheck for FastAPI
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/live || exit 1


EXPOSE ${PORT}


# Start FastAPI server
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]