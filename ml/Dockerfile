# ──────────────────────────────────────────────────────────────────
# 🧠 TrichMind ML Inference API — Dockerfile === ml/Dockerfile
# ──────────────────────────────────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Environment setup (aligned with ml/common/config.py)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Stockholm \
    PORT=8000 \
    TRICHMIND_BASE_DIR=/app \
    TRICHMIND_ARTIFACTS_DIR=/app/ml/artifacts \
    FEATURES_JSON=/app/ml/artifacts/preprocessed_outputs/metadata/features.json \
    ENCODER_PATH=/app/ml/artifacts/training_outputs/label_encoder/label_encoder.pkl \
    SCALER_PATH=/app/ml/artifacts/preprocessed_outputs/scaler_model/scaler.pkl \
    MODEL_PATH=/app/ml/artifacts/training_outputs/models/best_model_v1.pkl

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY ml/requirements.txt ./ml/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ml/requirements.txt

# Copy full project
COPY . .

# Healthcheck for FastAPI
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/live || exit 1

EXPOSE ${PORT}

# Start FastAPI server (aligned: api/api.py -> api.api:app)
CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]
