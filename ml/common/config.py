#!/usr/bin/env python3
from __future__ import annotations
import os
from pathlib import Path


# ─────────────────────────────────────────────────────────────────────
# Base directory (auto-detect inside Docker or local dev environment)
# ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(os.getenv("TRICHMIND_BASE_DIR", Path(__file__).resolve().parents[2]))

# ───────────────────────────────────────────────
# ARTIFACT ROOT
# ───────────────────────────────────────────────
ARTIFACTS_DIR = BASE_DIR / "ml" / "artifacts"

# ───────────────────────────────────────────────
# ARTIFACT SUBDIRECTORIES
# ───────────────────────────────────────────────
DB_DIR        = ARTIFACTS_DIR / "database"
EDA_DIR       = ARTIFACTS_DIR / "eda"
PREPROC_DIR   = ARTIFACTS_DIR / "preprocessed_outputs"
TRAIN_DIR     = ARTIFACTS_DIR / "training_outputs"
VAL_DIR       = ARTIFACTS_DIR / "validation_outputs"
TEST_DIR      = ARTIFACTS_DIR / "testing_outputs"
INFER_DIR     = ARTIFACTS_DIR / "inference_outputs"

# ───────────────────────────────────────────────
# PREPROCESSING ARTIFACTS
# ───────────────────────────────────────────────
SCALER_DIR       = PREPROC_DIR / "scaler_model"
PREPROC_META_DIR = PREPROC_DIR / "metadata"
PREPROC_FIG_DIR  = PREPROC_DIR / "figure-png"
PREPROC_LOG_DIR  = PREPROC_DIR / "logs"

# ────────────────────────────────────────────────────
# PREPROCESSING FILE PATHS - adjustable via ENV VARS
# ────────────────────────────────────────────────────
# ✔ Features JSON Path
FEATURES_JSON = Path(os.getenv(
        "FEATURES_JSON",
        str(PREPROC_META_DIR / "features.json")
))

# ✔ Scaler Path
SCALER_PATH = Path(os.getenv(
        "SCALER_PATH",
        str(SCALER_DIR / "scaler.pkl")
))

# Other Preprocessing Artifacts
PREPROC_META_JSON = PREPROC_META_DIR / "preprocessing_metadata.json"
HEATMAP_PNG = PREPROC_FIG_DIR / "correlation_heatmap.png"
IMPUTE_CSV  = PREPROC_DIR / "summary" / "imputation_summary.csv"

# Database
DB_PATH = DB_DIR / "ttm_database.db"

# ───────────────────────────────────────────────
# TRAINING ARTIFACTS
# ───────────────────────────────────────────────
MODEL_DIR = TRAIN_DIR / "best_models"
ENCODER_DIR = TRAIN_DIR / "label_encoder"

# Trained Model and Encoder Paths - adjustable via ENV VARS
MODEL_PATH = Path(os.getenv(
        "MODEL_PATH",
        str(MODEL_DIR / "best_relapse_risk_predictor_model.pkl")
))

#  Label Encoder Path
LABEL_ENCODER = Path(os.getenv(
        "ENCODER_PATH",
        str(ENCODER_DIR / "label_encoder.pkl")
))

# ───────────────────────────────────────────────
# TRAINING - LOGS AND METRICS PATHS
# ───────────────────────────────────────────────
TRAIN_LOG          = TRAIN_DIR / "logs" / "training_log.txt"
TRAIN_METRICS_CSV  = TRAIN_DIR / "metrics_csv" / "training_metrics.csv"
TRAIN_HISTORY_CSV  = TRAIN_DIR / "performance_history" / "training_performance_history.csv"

# ───────────────────────────────────────────────
# VALIDATION - LOGS AND METRICS PATHS
# ───────────────────────────────────────────────
VAL_FIG_DIR      = VAL_DIR / "figure-png"
VAL_LOG          = VAL_DIR / "logs" / "validation_log.txt"
VAL_METRICS_CSV  = VAL_DIR / "metrics_csv" / "validation_metrics.csv"
VAL_HISTORY_CSV  = VAL_DIR / "performance_history" / "validation_performance_history.csv"
VAL_ROC_PNG      = VAL_FIG_DIR / "roc.png"
VAL_CONF_PNG     = VAL_FIG_DIR / "confusion.png"

# ───────────────────────────────────────────────
# TESTING - LOGS AND METRICS PATHS
# ───────────────────────────────────────────────
TEST_LOG         = TEST_DIR / "logs" / "testing_log.txt"
TEST_METRICS_CSV = TEST_DIR / "metrics_csv" / "testing_metrics.csv"
TEST_HISTORY_CSV = TEST_DIR / "performance_history" / "testing_performance_history.csv"
TEST_REPORT_TXT  = TEST_DIR / "testing_reports" / "testing_classification_report.txt"

# ───────────────────────────────────────────────
# INFERENCE - LOGS PATHS
# ───────────────────────────────────────────────
INFER_LOG_DIR = INFER_DIR / "logs"
INFER_LOG_CSV = INFER_LOG_DIR / "inference_log.csv"

# ───────────────────────────────────────────────
# CSV IMPORT DEFAULTS
# ───────────────────────────────────────────────
CSV_DIR_DEFAULT = BASE_DIR / "ml" / "assets" / "csv_files"
CSV_SEPARATOR = ";"

# ───────────────────────────────────────────────
# ENSURE DIRECTORY CREATION
# ───────────────────────────────────────────────
for p in [
        DB_DIR, EDA_DIR, PREPROC_DIR, PREPROC_FIG_DIR, PREPROC_LOG_DIR,
        TRAIN_DIR, MODEL_DIR, ENCODER_DIR, VAL_DIR, VAL_FIG_DIR,
        TEST_DIR, INFER_DIR, INFER_LOG_DIR, PREPROC_DIR / "summary",
        TRAIN_DIR / "logs", TRAIN_DIR / "metrics_csv", TRAIN_DIR / "performance_history",
        VAL_DIR / "logs", VAL_DIR / "metrics_csv", VAL_DIR / "performance_history",
        TEST_DIR / "logs", TEST_DIR / "metrics_csv", TEST_DIR / "performance_history", TEST_DIR / "testing_reports",
        SCALER_DIR, PREPROC_META_DIR
]:
        p.mkdir(parents=True, exist_ok=True)
