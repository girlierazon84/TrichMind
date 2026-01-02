#!/usr/bin/env python3
"""
ml/scripts/train.py — TrichMind Model Trainer (small-data safe, versioned best-model saving)

Usage:
    python scripts/train.py

Writes to: ml/artifacts/training_outputs/
    - models/<best_name>_v<V>.pkl
    - models/current_model.json   (pointer)
    - label_encoder/label_encoder.pkl
    - splits/train_test_split_v<V>.json
    - logs/training_log.txt
    - metrics_csv/training_metrics.csv
    - performance_history/training_performance_history.csv
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
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import (
    DB_PATH,
    FEATURES_JSON,
    MODEL_DIR,
    MODEL_VERSION,
    MODEL_PATH,
    LABEL_ENCODER_PATH,
    TRAIN_LOG,
    TRAIN_METRICS_CSV,
    TRAIN_HISTORY_CSV,
    SPLITS_DIR,
    ensure_artifact_dirs,
)
from common.column_selector import ColumnSelector
from common.model_registry import write_current_model_pointer


# Random seed for reproducibility
SEED = 42
np.random.seed(SEED)

# Values for labels
LABELS = ["low", "medium", "high"]
LABEL_TO_INT = {"low": 0, "medium": 1, "high": 2}
INT_TO_LABEL = {v: k for k, v in LABEL_TO_INT.items()}

# Functions for logging
def log(msg: str) -> None:
    print(msg)
    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with TRAIN_LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Function to load features from the database
def load_features_table() -> pd.DataFrame:
    with sqlite3.connect(DB_PATH) as conn:
        return pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)

# Function to count class occurrences
def class_counts(y: np.ndarray) -> dict[int, int]:
    uniq, counts = np.unique(y, return_counts=True)
    return {int(u): int(c) for u, c in zip(uniq, counts)}

# Function to build labels
def build_labels(df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray, dict[str, Any]]:
    """
    Build labels from RAW columns when present.
    """
    info: dict[str, Any] = {"label_strategy": "rule_based_raw"}

    sev = df.get("pulling_severity_raw", df.get("pulling_severity", pd.Series([0] * len(df)))).astype(float)
    aw = df.get("awareness_level_encoded_raw", df.get("awareness_level_encoded", pd.Series([0.0] * len(df)))).astype(float)

    y_text = np.where(
        (sev >= 7) & (aw <= 0.5), "high",
        np.where(sev >= 5, "medium", "low"),
    )
    y_enc = np.array([LABEL_TO_INT[t] for t in y_text], dtype=int)

    counts = class_counts(y_enc)
    log(f"Class distribution (rule_based): { {INT_TO_LABEL[k]: v for k, v in counts.items()} }")

    min_count = min(counts.values()) if counts else 0
    if len(counts) < 2 or min_count < 2:
        log("⚠️ Label distribution too imbalanced for stable CV. Using quantile-based labels fallback.")

        q1, q2 = np.quantile(sev.to_numpy(), [1/3, 2/3])
        y_text2 = np.where(sev <= q1, "low", np.where(sev <= q2, "medium", "high"))
        y_enc2 = np.array([LABEL_TO_INT[t] for t in y_text2], dtype=int)

        counts2 = class_counts(y_enc2)
        log(f"Quantile cutoffs: q1={q1:.3f}, q2={q2:.3f}")
        log(f"Class distribution (quantiles): { {INT_TO_LABEL[k]: v for k, v in counts2.items()} }")

        info["label_strategy"] = "severity_quantiles"
        info["quantile_cutoffs"] = {"q1": float(q1), "q2": float(q2)}
        return y_text2, y_enc2, info

    return y_text, y_enc, info

# Function for robust train-test split
def robust_train_test_split(
    X: pd.DataFrame, y: np.ndarray
) -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray, dict[str, Any]]:
    n = len(y)
    counts = class_counts(y)
    min_count = min(counts.values()) if counts else 0
    can_stratify = (len(counts) >= 2) and (min_count >= 2)

    test_size = 0.2 if n >= 20 else max(0.2, 1.0 / max(n, 1))

    split_meta = {
        "seed": SEED,
        "test_size": test_size,
        "stratified": bool(can_stratify),
        "class_counts": {INT_TO_LABEL[k]: v for k, v in counts.items()},
    }

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=SEED,
            stratify=y if can_stratify else None,
        )
        return X_train, X_test, y_train, y_test, split_meta
    except ValueError as e:
        log(f"⚠️ Split failed ({e}). Falling back to non-stratified split.")
        split_meta["stratified"] = False
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=SEED, stratify=None
        )
        return X_train, X_test, y_train, y_test, split_meta

# Function to save split indices
def save_split_indices(X_train: pd.DataFrame, X_test: pd.DataFrame) -> Path:
    SPLITS_DIR.mkdir(parents=True, exist_ok=True)
    split_path = SPLITS_DIR / f"train_test_split_v{MODEL_VERSION}.json"
    payload = {
        "version": MODEL_VERSION,
        "seed": SEED,
        "train_idx": [int(i) for i in X_train.index.tolist()],
        "test_idx": [int(i) for i in X_test.index.tolist()],
    }
    split_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return split_path

# Main training function
def main() -> None:
    ensure_artifact_dirs()

    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    TRAIN_LOG.write_text("", encoding="utf-8")

    log("──── TrichMind Training start ────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")
    if not FEATURES_JSON.exists():
        raise FileNotFoundError(f"❌ FEATURES_JSON not found at: {FEATURES_JSON}")

    df = load_features_table()
    feature_names = json.loads(FEATURES_JSON.read_text(encoding="utf-8"))
    log(f"Loaded {len(df)} samples with {len(feature_names)} features")

    _, y, label_info = build_labels(df)

    # consistent label encoder artifact
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    le.classes_ = np.array(["low", "medium", "high"], dtype=object)
    LABEL_ENCODER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(le, LABEL_ENCODER_PATH)
    log(f"Saved label encoder → {LABEL_ENCODER_PATH} (classes={list(le.classes_)})")

    X = df[feature_names].copy()

    X_train, X_test, y_train, y_test, split_meta = robust_train_test_split(X, y)
    split_path = save_split_indices(X_train, X_test)
    log(f"Saved split indices → {split_path}")

    train_counts = class_counts(y_train)
    min_train_count = min(train_counts.values()) if train_counts else 0
    cv = None
    if len(train_counts) >= 2 and min_train_count >= 2:
        n_splits = min(5, min_train_count)
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)
        log(f"{n_splits}-fold CV (accuracy):")
    else:
        log("⚠️ Not enough class support for CV. Skipping CV.")

    candidates: dict[str, Pipeline] = {
        "logreg": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", LogisticRegression(max_iter=2000, random_state=SEED, class_weight="balanced")),
        ]),
        "rf": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", RandomForestClassifier(n_estimators=400, random_state=SEED, class_weight="balanced")),
        ]),
        "gb": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", GradientBoostingClassifier(n_estimators=250, learning_rate=0.05, random_state=SEED)),
        ]),
        "mlp": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=800, random_state=SEED)),
        ]),
    }

    best_name, best_score, best_pipe = None, -1.0, None

    if cv is not None:
        for name, pipe in candidates.items():
            try:
                scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="accuracy", error_score=np.nan)
                mean = float(np.nanmean(scores))
                std = float(np.nanstd(scores))
                log(f" • {name:<6} = {mean:.3f} ± {std:.3f}")
                if mean > best_score:
                    best_name, best_score, best_pipe = name, mean, pipe
            except Exception as e:
                log(f" ! {name} skipped: {e}")
    else:
        best_name, best_pipe, best_score = "rf", candidates["rf"], float("nan")

    if best_pipe is None:
        best_name, best_pipe, best_score = "rf", candidates["rf"], float("nan")
        log("⚠️ No valid model selected — using RandomForest fallback.")

    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    best_model_path = MODEL_DIR / f"{best_name}_v{MODEL_VERSION}.pkl"

    setattr(best_pipe, "feature_names_", feature_names)
    setattr(best_pipe, "class_labels_", ["low", "medium", "high"])
    joblib.dump(best_pipe, best_model_path)

    # optional compatibility save
    try:
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(best_pipe, MODEL_PATH)
    except Exception:
        pass

    TRAIN_METRICS_CSV.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame([[best_name, acc, prec, rec, f1]],
                    columns=["Model", "Accuracy", "Precision", "Recall", "F1"]).to_csv(TRAIN_METRICS_CSV, index=False)

    TRAIN_HISTORY_CSV.parent.mkdir(parents=True, exist_ok=True)
    hist_row = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Model": best_name,
        "Version": MODEL_VERSION,
        "CV_Accuracy": best_score,
        "Test_Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1,
        "Path": str(best_model_path),
        "LabelStrategy": label_info.get("label_strategy"),
        "SplitPath": str(split_path),
    }])
    hist_row.to_csv(TRAIN_HISTORY_CSV, mode="a", header=not TRAIN_HISTORY_CSV.exists(), index=False)

    meta = {
        "cv_accuracy": best_score,
        "test_accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "split_path": str(split_path),
        "split_meta": split_meta,
        **label_info,
    }

    # ✅ FIX: no model_json_path kwarg (registry writes to CURRENT_MODEL_JSON from config)
    write_current_model_pointer(
        best_model_path=best_model_path,
        model_name=best_name,
        model_version=MODEL_VERSION,
        extra=meta,
    )

    log(f"✅ Best={best_name} CV={best_score} | Test Acc={acc:.3f}")
    log(f"Model saved → {best_model_path}")
    log("Pointer → models/current_model.json updated")
    log("──── Training complete ────")


if __name__ == "__main__":
    main()
