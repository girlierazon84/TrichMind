# ──────────────────────────────
# 🧠 TrichMind ML Inference API — Dockerfile
# Base: lightweight Python 3.13 slim
# ──────────────────────────────
FROM python:3.13.7-slim

# Set working directory
WORKDIR /app

# Prevent Python from writing .pyc files and enable unbuffered logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Europe/Stockholm \
    MODEL_PATH=/app/artifacts/training_outputs/best_models/best_relapse_risk_predictor_model.pkl \
    ENCODER_PATH=/app/artifacts/training_outputs/label_encoder/label_encoder.pkl \
    PORT=8000

# Install system deps & curl for healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies first (cache efficient)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Healthcheck (optional, checks FastAPI /live endpoint)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/live || exit 1

# Expose FastAPI port
EXPOSE ${PORT}

# Start server using uvicorn with optimized settings
CMD ["uvicorn", "inference_api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
