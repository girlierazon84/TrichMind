#!/usr/bin/env python3
"""
ml/scripts/model_validation.py — TrichMind Hyperparameter Tuning (Model Validation)

Usage:
    python scripts/model_validation.py

Writes to: ml/artifacts/tuning_outputs/
    - results/tuning_results.csv
    - best/best_params.json
    - best/best_tuned_model_v<V>.pkl

Optionally updates the active model pointer (models/current_model.json)
to the tuned model.
"""

from __future__ import annotations

import sys
import json
from datetime import datetime
from pathlib import Path
import sqlite3
from typing import Any

import joblib
import numpy as np
import pandas as pd

from sklearn.pipeline import Pipeline
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier

# Path setup
ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import (
    DB_PATH,
    FEATURES_JSON,
    MODEL_DIR,
    MODEL_VERSION,
    TUNE_LOG,
    TUNE_RESULTS_CSV,
    TUNE_BEST_PARAMS_JSON,
    TUNE_BEST_MODEL_PATH,
    LABEL_ENCODER_PATH,
    ensure_artifact_dirs,
)
from common.column_selector import ColumnSelector
from common.model_registry import write_current_model_pointer


# Random seed for reproducibility
SEED = 42
np.random.seed(SEED)

# Label mappings
LABELS = ["low", "medium", "high"]
LABEL_TO_INT = {"low": 0, "medium": 1, "high": 2}
INT_TO_LABEL = {v: k for k, v in LABEL_TO_INT.items()}

# Logging function
def log(msg: str) -> None:
    print(msg)
    TUNE_LOG.parent.mkdir(parents=True, exist_ok=True)
    with TUNE_LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Load features table from DB
def load_features_table() -> pd.DataFrame:
    with sqlite3.connect(DB_PATH) as conn:
        return pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)

# Compute class counts
def class_counts(y: np.ndarray) -> dict[int, int]:
    uniq, counts = np.unique(y, return_counts=True)
    return {int(u): int(c) for u, c in zip(uniq, counts)}

# Build labels function
def build_labels(df: pd.DataFrame) -> tuple[np.ndarray, dict[str, Any]]:
    """
    Same label strategy as train.py (RAW preferred; quantile fallback).
    """
    info: dict[str, Any] = {"label_strategy": "rule_based_raw"}

    sev = df.get("pulling_severity_raw", df.get("pulling_severity", pd.Series([0] * len(df)))).astype(float)
    aw = df.get("awareness_level_encoded_raw", df.get("awareness_level_encoded", pd.Series([0.0] * len(df)))).astype(float)

    y_text = np.where(
        (sev >= 7) & (aw <= 0.5), "high",
        np.where(sev >= 5, "medium", "low"),
    )
    y = np.array([LABEL_TO_INT[t] for t in y_text], dtype=int)

    counts = class_counts(y)
    min_count = min(counts.values()) if counts else 0

    if len(counts) < 2 or min_count < 2:
        log("⚠️ Too imbalanced for stable tuning. Using quantile labels fallback.")
        q1, q2 = np.quantile(sev.to_numpy(), [1/3, 2/3])
        y_text2 = np.where(sev <= q1, "low", np.where(sev <= q2, "medium", "high"))
        y2 = np.array([LABEL_TO_INT[t] for t in y_text2], dtype=int)
        info["label_strategy"] = "severity_quantiles"
        info["quantile_cutoffs"] = {"q1": float(q1), "q2": float(q2)}
        return y2, info

    return y, info

# Save label encoder
def save_label_encoder() -> None:
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    le.classes_ = np.array(["low", "medium", "high"], dtype=object)
    LABEL_ENCODER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(le, LABEL_ENCODER_PATH)
    log(f"Saved label encoder → {LABEL_ENCODER_PATH} (classes={list(le.classes_)})")

# Main tuning function
def main() -> None:
    ensure_artifact_dirs()
    TUNE_LOG.parent.mkdir(parents=True, exist_ok=True)
    TUNE_LOG.write_text("", encoding="utf-8")

    log("──── TrichMind Model Validation (Tuning) start ────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ DB not found: {DB_PATH}")
    if not FEATURES_JSON.exists():
        raise FileNotFoundError(f"❌ FEATURES_JSON not found: {FEATURES_JSON}")

    df = load_features_table()
    feature_names = json.loads(FEATURES_JSON.read_text(encoding="utf-8"))
    X = df[feature_names].copy()
    y, label_info = build_labels(df)

    log(f"Loaded {len(df)} samples, {len(feature_names)} features.")
    log(f"Label strategy: {label_info.get('label_strategy')}")

    save_label_encoder()

    counts = class_counts(y)
    min_count = min(counts.values()) if counts else 0
    if len(counts) < 2 or min_count < 2:
        log("⚠️ Not enough class support for CV tuning. Aborting tuning.")
        return

    n_splits = min(5, min_count)
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
    log(f"Using {n_splits}-fold Stratified CV")

    # Candidate pipelines
    candidates: dict[str, Pipeline] = {
        "logreg": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", LogisticRegression(max_iter=4000, random_state=SEED, class_weight="balanced")),
        ]),
        "rf": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", RandomForestClassifier(random_state=SEED, class_weight="balanced")),
        ]),
        "gb": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", GradientBoostingClassifier(random_state=SEED)),
        ]),
        "mlp": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", MLPClassifier(max_iter=1200, random_state=SEED)),
        ]),
    }

    # Search spaces (small-data safe)
    param_spaces: dict[str, dict[str, list[Any]]] = {
        "logreg": {
            "clf__C": [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
            "clf__solver": ["lbfgs"],
        },
        "rf": {
            "clf__n_estimators": [200, 400, 700, 1000],
            "clf__max_depth": [None, 4, 6, 8, 12],
            "clf__min_samples_split": [2, 4, 6, 10],
            "clf__min_samples_leaf": [1, 2, 4],
            "clf__max_features": ["sqrt", "log2", None],
        },
        "gb": {
            "clf__n_estimators": [100, 200, 300, 500],
            "clf__learning_rate": [0.01, 0.03, 0.05, 0.1],
            "clf__max_depth": [2, 3, 4],
            "clf__subsample": [0.7, 0.85, 1.0],
        },
        "mlp": {
            "clf__hidden_layer_sizes": [(64,), (128,), (128, 64), (256, 128)],
            "clf__alpha": [1e-5, 1e-4, 1e-3, 1e-2],
            "clf__learning_rate_init": [1e-4, 5e-4, 1e-3, 5e-3],
        },
    }

    results: list[dict[str, Any]] = []
    best_global = {"name": None, "score": -1.0, "estimator": None, "params": None}

    # Tune each candidate
    for name, pipe in candidates.items():
        log(f"\n── Tuning: {name} ──")
        search = RandomizedSearchCV(
            estimator=pipe,
            param_distributions=param_spaces[name],
            n_iter=20,
            scoring="f1_weighted",
            cv=cv,
            random_state=SEED,
            n_jobs=-1,
            verbose=0,
        )
        search.fit(X, y)

        best_est = search.best_estimator_
        best_params = search.best_params_
        best_cv = float(search.best_score_)

        # quick “fit on full data” sanity metrics (not a holdout test)
        best_est.fit(X, y)
        pred = best_est.predict(X)
        acc = float(accuracy_score(y, pred))
        prec = float(precision_score(y, pred, average="weighted", zero_division=0))
        rec = float(recall_score(y, pred, average="weighted", zero_division=0))
        f1w = float(f1_score(y, pred, average="weighted", zero_division=0))

        log(f"Best CV f1_weighted={best_cv:.3f}")
        log(f"Train-fit metrics (sanity): acc={acc:.3f} f1w={f1w:.3f}")

        results.append({
            "Model": name,
            "CV_F1_weighted": best_cv,
            "Train_Accuracy": acc,
            "Train_F1_weighted": f1w,
            "BestParams": json.dumps(best_params),
        })

        if best_cv > best_global["score"]:
            best_global = {"name": name, "score": best_cv, "estimator": best_est, "params": best_params}

    # Save results
    TUNE_RESULTS_CSV.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(results).sort_values("CV_F1_weighted", ascending=False).to_csv(TUNE_RESULTS_CSV, index=False)
    log(f"\n✅ Tuning results → {TUNE_RESULTS_CSV}")

    # Save best model + params
    best_name = str(best_global["name"])
    best_estimator = best_global["estimator"]
    best_params = best_global["params"] or {}

    if best_estimator is None:
        log("❌ No tuned model selected.")
        return

    TUNE_BEST_PARAMS_JSON.parent.mkdir(parents=True, exist_ok=True)
    TUNE_BEST_PARAMS_JSON.write_text(json.dumps({
        "best_model": best_name,
        "best_cv_f1_weighted": float(best_global["score"]),
        "best_params": best_params,
        "timestamp": datetime.now().isoformat(),
        **label_info,
    }, indent=2), encoding="utf-8")
    log(f"✅ Best params → {TUNE_BEST_PARAMS_JSON}")

    TUNE_BEST_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_estimator, TUNE_BEST_MODEL_PATH)
    log(f"✅ Best tuned model → {TUNE_BEST_MODEL_PATH}")

    # OPTIONAL: promote tuned model to active pointer
    promote_to_active = True
    if promote_to_active:
        meta = {
            "tuning_cv_f1_weighted": float(best_global["score"]),
            "best_params": best_params,
            "tuned_model_path": str(TUNE_BEST_MODEL_PATH),
            **label_info,
        }
        write_current_model_pointer(
            best_model_path=TUNE_BEST_MODEL_PATH,
            model_name=f"{best_name}_tuned",
            model_version=MODEL_VERSION,
            extra=meta,
        )
        log("✅ current_model.json pointer updated to tuned model.")

    log("──── Tuning complete ────")


if __name__ == "__main__":
    main()
