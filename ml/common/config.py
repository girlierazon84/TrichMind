#!/usr/bin/env python3
"""
ml/common/config.py - Central configuration for ML artifact paths.

Buckets live under:
    ml/artifacts/
        - preprocessed_outputs/
        - training_outputs/
        - evaluation_outputs/
        - tuning_outputs/
        - testing_outputs/
        - inference_outputs/
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable


# Helper to find repo root
def _repo_root_from_here(file_path: Path) -> Path:
    # <repo>/ml/common/config.py -> repo root is parents[2]
    return file_path.resolve().parents[2]

# ───────────────────────────────────────────────
# ROOTS
# ───────────────────────────────────────────────
REPO_ROOT = Path(os.getenv("TRICHMIND_BASE_DIR", str(_repo_root_from_here(Path(__file__)))))
ARTIFACTS_DIR = Path(os.getenv("TRICHMIND_ARTIFACTS_DIR", str(REPO_ROOT / "ml" / "artifacts")))

# Buckets (same level)
DB_DIR = ARTIFACTS_DIR / "database"
EDA_DIR = ARTIFACTS_DIR / "eda"
PREPROC_DIR = ARTIFACTS_DIR / "preprocessed_outputs"
TRAIN_DIR = ARTIFACTS_DIR / "training_outputs"
EVAL_DIR = ARTIFACTS_DIR / "evaluation_outputs"     # ✅ moved out of TRAIN_DIR
TUNE_DIR = ARTIFACTS_DIR / "tuning_outputs"         # ✅ new: for hyperparameter tuning
TEST_DIR = ARTIFACTS_DIR / "testing_outputs"
INFER_DIR = ARTIFACTS_DIR / "inference_outputs"

# ───────────────────────────────────────────────
# PREPROCESSING
# ───────────────────────────────────────────────
SCALER_DIR = PREPROC_DIR / "scaler_model"
PREPROC_META_DIR = PREPROC_DIR / "metadata"
PREPROC_FIG_DIR = PREPROC_DIR / "figure-png"
PREPROC_LOG_DIR = PREPROC_DIR / "logs"
PREPROC_SUMMARY_DIR = PREPROC_DIR / "summary"

FEATURES_JSON = Path(os.getenv("FEATURES_JSON", str(PREPROC_META_DIR / "features.json")))
SCALER_PATH = Path(os.getenv("SCALER_PATH", str(SCALER_DIR / "scaler.pkl")))

PREPROC_META_JSON = PREPROC_META_DIR / "preprocessing_metadata.json"
HEATMAP_PNG = PREPROC_FIG_DIR / "correlation_heatmap.png"
IMPUTE_CSV = PREPROC_SUMMARY_DIR / "imputation_summary.csv"

DB_PATH = Path(os.getenv("DB_PATH", str(DB_DIR / "ttm_database.db")))

# ───────────────────────────────────────────────
# TRAINING (MODEL VERSIONING)
# ───────────────────────────────────────────────
MODEL_DIR = TRAIN_DIR / "models"
ENCODER_DIR = TRAIN_DIR / "label_encoder"
TRAIN_LOG_DIR = TRAIN_DIR / "logs"
TRAIN_METRICS_DIR = TRAIN_DIR / "metrics_csv"
TRAIN_HISTORY_DIR = TRAIN_DIR / "performance_history"
SPLITS_DIR = TRAIN_DIR / "splits"

MODEL_NAME = os.getenv("MODEL_NAME", "best_model").strip() or "best_model"
MODEL_VERSION = int(os.getenv("MODEL_VERSION", "1"))
MODEL_FILENAME = os.getenv("MODEL_FILENAME", f"{MODEL_NAME}_v{MODEL_VERSION}.pkl")

MODEL_PATH = Path(os.getenv("MODEL_PATH", str(MODEL_DIR / MODEL_FILENAME)))
LABEL_ENCODER_PATH = Path(os.getenv("ENCODER_PATH", str(ENCODER_DIR / "label_encoder.pkl")))

# Backwards-compatible alias for your FastAPI code (it imports LABEL_ENCODER)
LABEL_ENCODER = LABEL_ENCODER_PATH  # ✅ alias

# ✅ pointer file (must be a file, not a folder)
CURRENT_MODEL_JSON = MODEL_DIR / "current_model.json"

TRAIN_LOG = TRAIN_LOG_DIR / "training_log.txt"
TRAIN_METRICS_CSV = TRAIN_METRICS_DIR / "training_metrics.csv"
TRAIN_HISTORY_CSV = TRAIN_HISTORY_DIR / "training_performance_history.csv"

# ───────────────────────────────────────────────
# MODEL EVALUATION (REPORTING)
# ───────────────────────────────────────────────
EVAL_FIG_DIR = EVAL_DIR / "figures"
EVAL_REPORT_DIR = EVAL_DIR / "reports"
EVAL_LOG_DIR = EVAL_DIR / "logs"

# ───────────────────────────────────────────────
# MODEL VALIDATION / TUNING (HYPERPARAM SEARCH)
# ───────────────────────────────────────────────
TUNE_LOG_DIR = TUNE_DIR / "logs"
TUNE_RESULTS_DIR = TUNE_DIR / "results"
TUNE_BEST_DIR = TUNE_DIR / "best"

TUNE_LOG = TUNE_LOG_DIR / "tuning_log.txt"
TUNE_RESULTS_CSV = TUNE_RESULTS_DIR / "tuning_results.csv"
TUNE_BEST_PARAMS_JSON = TUNE_BEST_DIR / "best_params.json"
TUNE_BEST_MODEL_PATH = TUNE_BEST_DIR / f"best_tuned_model_v{MODEL_VERSION}.pkl"

# ───────────────────────────────────────────────
# TESTING
# ───────────────────────────────────────────────
TEST_LOG_DIR = TEST_DIR / "logs"
TEST_METRICS_DIR = TEST_DIR / "metrics_csv"
TEST_HISTORY_DIR = TEST_DIR / "performance_history"
TEST_REPORT_DIR = TEST_DIR / "testing_reports"

TEST_LOG = TEST_LOG_DIR / "testing_log.txt"
TEST_METRICS_CSV = TEST_METRICS_DIR / "testing_metrics.csv"
TEST_HISTORY_CSV = TEST_HISTORY_DIR / "testing_performance_history.csv"
TEST_REPORT_TXT = TEST_REPORT_DIR / "testing_classification_report.txt"

# ───────────────────────────────────────────────
# INFERENCE
# ───────────────────────────────────────────────
INFER_LOG_DIR = INFER_DIR / "logs"
INFER_LOG_CSV = INFER_LOG_DIR / "inference_log.csv"

# ───────────────────────────────────────────────
# CSV IMPORT DEFAULTS
# ───────────────────────────────────────────────
CSV_DIR_DEFAULT = Path(os.getenv("TRICHMIND_CSV_DIR", str(REPO_ROOT / "ml" / "assets" / "csv_files")))
CSV_SEPARATOR = os.getenv("CSV_SEPARATOR", ";")


def ensure_dirs(paths: Iterable[Path]) -> None:
    for p in paths:
        p.mkdir(parents=True, exist_ok=True)


def ensure_artifact_dirs() -> None:
    ensure_dirs([
        ARTIFACTS_DIR,
        DB_DIR,
        EDA_DIR,
        PREPROC_DIR,
        SCALER_DIR,
        PREPROC_META_DIR,
        PREPROC_FIG_DIR,
        PREPROC_LOG_DIR,
        PREPROC_SUMMARY_DIR,
        TRAIN_DIR,
        MODEL_DIR,
        ENCODER_DIR,
        TRAIN_LOG_DIR,
        TRAIN_METRICS_DIR,
        TRAIN_HISTORY_DIR,
        SPLITS_DIR,
        EVAL_DIR,
        EVAL_FIG_DIR,
        EVAL_REPORT_DIR,
        EVAL_LOG_DIR,
        TUNE_DIR,
        TUNE_LOG_DIR,
        TUNE_RESULTS_DIR,
        TUNE_BEST_DIR,
        TEST_DIR,
        TEST_LOG_DIR,
        TEST_METRICS_DIR,
        TEST_HISTORY_DIR,
        TEST_REPORT_DIR,
        INFER_DIR,
        INFER_LOG_DIR,
    ])
