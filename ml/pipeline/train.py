#!/usr/bin/env python3
"""
train.py — TrichMind Relapse Risk Model Trainer (Consistent Label Mapping Edition)

Ensures:
    - Always consistent label order: low=0, medium=1, high=2
    - Avoids misalignment between LabelEncoder and model.classes_
    - Cross-validation and automatic best model selection
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
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from pathlib import Path

from common.config import (
    DB_PATH, FEATURES_JSON, LABEL_ENCODER, MODEL_PATH,
    TRAIN_LOG, TRAIN_METRICS_CSV, TRAIN_HISTORY_CSV
)
from common.transformers import ColumnSelector
from common.risk import LABELS  # ['low', 'medium', 'high']


# ──────────────────────────────
# Set random seed
# ──────────────────────────────
SEED = 42
np.random.seed(SEED)

# ──────────────────────────────
# Logging
# ──────────────────────────────
def log(msg: str):
    print(msg)
    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(TRAIN_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")


# ──────────────────────────────
# Data Loading
# ──────────────────────────────
def load_table() -> pd.DataFrame:
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
    conn.close()
    return df


# ──────────────────────────────
# Label Building (fixed mapping)
# ──────────────────────────────
def build_labels(df: pd.DataFrame):
    sev = df.get("pulling_severity", pd.Series([0]*len(df)))
    aw = df.get("awareness_level_encoded", pd.Series([0.0]*len(df)))

    y_text = np.where(
        (sev >= 7) & (aw <= 0.5), "high",
        np.where(sev >= 5, "medium", "low")
    )

    # Manual consistent mapping
    LABEL_TO_INT = {"low": 0, "medium": 1, "high": 2}
    y_enc = np.array([LABEL_TO_INT[t] for t in y_text])

    unique, counts = np.unique(y_enc, return_counts=True)
    log(f"Class distribution (initial): {dict(zip(unique, counts))}")

    # Fallbacks
    if len(unique) < 2:
        log("⚠️ Only one class detected — applying percentile-based pseudo-labels.")
        q33, q66 = np.percentile(sev, [33, 66])
        y_text = np.where(sev <= q33, "low",
                            np.where(sev <= q66, "medium", "high"))
        y_enc = np.array([LABEL_TO_INT[t] for t in y_text])
        unique, counts = np.unique(y_enc, return_counts=True)
        log(f"Class distribution (synthetic): {dict(zip(unique, counts))}")

    # Build a label encoder that exactly matches the numeric mapping
    from sklearn.preprocessing import LabelEncoder
    le = LabelEncoder()
    le.classes_ = np.array(["low", "medium", "high"], dtype=object)
    joblib.dump(le, LABEL_ENCODER)
    log(f"Saved label encoder → {LABEL_ENCODER} (classes={list(le.classes_)})")

    return y_text, y_enc, le


# ──────────────────────────────
# Main training
# ──────────────────────────────
if __name__ == "__main__":
    open(TRAIN_LOG, "w").close()
    log("──── TrichMind Training start ────")

    df = load_table()
    feature_names = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
    log(f"Loaded {len(df)} samples with {len(feature_names)} features")

    y_text, y_enc, le = build_labels(df)
    X = df[feature_names].copy()

    stratify_opt = y_enc if len(np.unique(y_enc)) > 1 else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=stratify_opt, random_state=SEED
    )

    n_splits = min(5, len(np.unique(y_train)) * 2)
    cv = StratifiedKFold(n_splits=max(2, n_splits), shuffle=True, random_state=SEED)

    candidates = {
        "LogReg": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", LogisticRegression(max_iter=1200, random_state=SEED))
        ]),
        "RF": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", RandomForestClassifier(n_estimators=400, random_state=SEED))
        ]),
        "GB": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", GradientBoostingClassifier(n_estimators=250, learning_rate=0.05, random_state=SEED))
        ]),
        "MLP": Pipeline([
            ("sel", ColumnSelector(feature_names)),
            ("clf", MLPClassifier(hidden_layer_sizes=(128,64), max_iter=800, random_state=SEED))
        ]),
    }

    best_name, best_score, best_pipe = None, -1.0, None
    log("5-fold CV (accuracy):")
    for name, pipe in candidates.items():
        try:
            scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring="accuracy")
            log(f" • {name:<6} = {scores.mean():.3f} ± {scores.std():.3f}")
            if scores.mean() > best_score:
                best_name, best_score, best_pipe = name, scores.mean(), pipe
        except Exception as e:
            log(f" ! {name} skipped: {e}")

    if best_pipe is None:
        best_name, best_pipe = "RF", candidates["RF"]
        log("⚠️ No valid model trained — using RandomForest as fallback.")

    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    setattr(best_pipe, "feature_names_", feature_names)
    setattr(best_pipe, "class_labels_", ["low", "medium", "high"])
    joblib.dump(best_pipe, MODEL_PATH)

    pd.DataFrame([[best_name, acc, prec, rec, f1]],
                    columns=["Model","Accuracy","Precision","Recall","F1"]
                    ).to_csv(TRAIN_METRICS_CSV, index=False)

    hist_row = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Model": best_name, "Accuracy": acc, "Precision": prec, "Recall": rec, "F1": f1
    }])
    hist_row.to_csv(TRAIN_HISTORY_CSV, mode="a", header=not TRAIN_HISTORY_CSV.exists(), index=False)

    log(f"✅ Best={best_name} CV={best_score:.3f} | Test Acc={acc:.3f}")
    log(f"Model → {MODEL_PATH}")
    log(f"Metrics → {TRAIN_METRICS_CSV}")
    log("──── Training complete ────")
