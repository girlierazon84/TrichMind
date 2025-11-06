#!/usr/bin/env python3
"""
train.py — TrichMind Relapse Risk Model Trainer (Unified Feature Edition)

• Loads preprocessed features from SQLite (from data_preprocessing_unified.py)
• Builds relapse-risk labels based on pulling_severity & awareness
• Fallbacks: binary mode or percentile-based pseudo-labels if data is uniform
• Performs cross-validation and selects best model automatically
• Saves trained model, label encoder, metrics, and training history
"""

from __future__ import annotations
import json
from datetime import datetime
import joblib
import numpy as np
import pandas as pd
import sqlite3
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from pathlib import Path
from common.config import (
    DB_PATH, FEATURES_JSON, LABEL_ENCODER, MODEL_PATH,
    TRAIN_LOG, TRAIN_METRICS_CSV, TRAIN_HISTORY_CSV
)
from common.transformers import ColumnSelector
from common.risk import LABELS  # ['low', 'medium', 'high']

# ──────────────────────────────
# Globals
# ──────────────────────────────
SEED = 42
np.random.seed(SEED)


# ──────────────────────────────
# Logging utility
# ──────────────────────────────
def log(msg: str) -> None:
    """Write and print logs simultaneously."""
    print(msg)
    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(TRAIN_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


# ──────────────────────────────
# Load preprocessed data
# ──────────────────────────────
def load_table() -> pd.DataFrame:
    """Load unified feature table from SQLite."""
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
    conn.close()
    return df


# ──────────────────────────────
# Label construction
# ──────────────────────────────
def build_labels(df: pd.DataFrame):
    """Construct relapse-risk labels dynamically."""
    sev = df.get("pulling_severity", pd.Series([0] * len(df)))
    aw = df.get("awareness_level_encoded", pd.Series([0.0] * len(df)))

    # Step 1: main label rule
    y_text = np.where(
        (sev >= 7) & (aw <= 0.5), "high",
        np.where(sev >= 5, "medium", "low")
    )

    le = LabelEncoder()
    le.classes_ = np.array(LABELS, dtype=object)
    y_enc = le.transform(y_text)

    # Inspect class balance
    unique_classes, counts = np.unique(y_enc, return_counts=True)
    log(f"Class distribution (initial): {dict(zip(unique_classes, counts))}")

    # Step 2: binary fallback if only 1 unique class
    if len(unique_classes) < 2:
        log("⚠️ Only one class detected — switching to binary risk labels.")
        y_text = np.where(sev >= 6, "high", "low")
        le.classes_ = np.array(["low", "high"], dtype=object)
        y_enc = le.fit_transform(y_text)
        unique_classes, counts = np.unique(y_enc, return_counts=True)
        log(f"Class distribution (binary fallback): {dict(zip(unique_classes, counts))}")

    # Step 3: percentile fallback if still 1 unique class
    if len(unique_classes) < 2:
        log("⚠️ Still single class — applying percentile-based pseudo-labels.")
        q33, q66 = np.percentile(sev, [33, 66])
        y_text = np.where(
            sev <= q33, "low",
            np.where(sev <= q66, "medium", "high")
        )
        le.classes_ = np.array(["low", "medium", "high"], dtype=object)
        y_enc = le.fit_transform(y_text)
        unique_classes, counts = np.unique(y_enc, return_counts=True)
        log(f"Class distribution (percentile synthetic): {dict(zip(unique_classes, counts))}")

    return y_text, y_enc, le


# ──────────────────────────────
# Main training routine
# ──────────────────────────────
if __name__ == "__main__":
    open(TRAIN_LOG, "w").close()
    log("──── TrichMind Training start ────")

    # Load data
    df = load_table()
    feature_names = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
    log(f"Loaded {len(df)} samples with {len(feature_names)} features")

    # Build labels
    y_text, y_enc, le = build_labels(df)
    joblib.dump(le, LABEL_ENCODER)
    log(f"Saved label encoder → {LABEL_ENCODER} (classes={list(le.classes_)})")

    # Prepare feature data
    X = df[feature_names].copy()
    stratify_opt = y_enc if len(np.unique(y_enc)) > 1 else None

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=stratify_opt, random_state=SEED
    )

    # Stratified CV setup (auto-adjust folds)
    n_splits = min(5, len(np.unique(y_train)) * 2)
    cv = StratifiedKFold(n_splits=max(2, n_splits), shuffle=True, random_state=SEED)

    # Define model candidates
    candidates = {
        "LogReg": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", LogisticRegression(max_iter=1200, random_state=SEED))
        ]),
        "RF": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", RandomForestClassifier(
                n_estimators=400, max_depth=None, random_state=SEED))
        ]),
        "GB": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", GradientBoostingClassifier(
                n_estimators=250, learning_rate=0.05, random_state=SEED))
        ]),
        "MLP": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=800, random_state=SEED))
        ]),
    }

    # Cross-validation & selection
    best_name, best_score, best_pipe = None, -1.0, None
    log("5-fold CV (accuracy):")
    for name, pipe in candidates.items():
        try:
            if len(np.unique(y_train)) < 2:
                raise ValueError("Training data has only one class; cannot train model.")
            scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="accuracy")
            log(f" • {name:<6} = {scores.mean():.3f} ± {scores.std():.3f}")
            if scores.mean() > best_score:
                best_name, best_score, best_pipe = name, scores.mean(), pipe
        except Exception as e:
            log(f" ! {name} skipped: {e}")

    # Fallback if none succeeded
    if best_pipe is None:
        log("⚠️ No valid model trained — using RandomForest as safe fallback.")
        best_name, best_pipe = "RF", candidates["RF"]

    # Final training
    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)

    # Evaluation metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    # Save model and metrics
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    setattr(best_pipe, "feature_names_", feature_names)
    setattr(best_pipe, "class_labels_", list(le.classes_))
    joblib.dump(best_pipe, MODEL_PATH)

    pd.DataFrame([[best_name, acc, prec, rec, f1]],
                    columns=["Model", "Accuracy", "Precision", "Recall", "F1"]).to_csv(
        TRAIN_METRICS_CSV, index=False
    )

    hist_row = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Model": best_name, "Accuracy": acc,
        "Precision": prec, "Recall": rec, "F1": f1
    }])
    hist_row.to_csv(TRAIN_HISTORY_CSV, mode="a", header=not TRAIN_HISTORY_CSV.exists(), index=False)

    # Summary log
    log(f"✅ Best={best_name} CV={best_score:.3f} | Test Acc={acc:.3f}")
    log(f"Model → {MODEL_PATH}")
    log(f"Metrics → {TRAIN_METRICS_CSV}")
    log("──── Training complete ────")
