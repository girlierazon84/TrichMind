#!/usr/bin/env python3
"""
ml/scripts/test_model.py — TrichMind Model Testing (aligned, reproducible)

Usage:
    python scripts/test_model.py

Behavior:
    - Loads model via models/current_model.json
    - Uses saved split_path from pointer meta (if present)
    - Builds labels using SAME strategy as training (rule_based_raw or severity_quantiles)
"""

from __future__ import annotations

import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.model_selection import train_test_split

ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import (
    DB_PATH,
    FEATURES_JSON,
    TEST_LOG,
    TEST_METRICS_CSV,
    TEST_REPORT_TXT,
    TEST_HISTORY_CSV,
    ensure_artifact_dirs,
)
from common.model_registry import read_current_model_pointer


# Label mappings & Random seed
LABELS = ["low", "medium", "high"]
LABEL_TO_INT = {"low": 0, "medium": 1, "high": 2}
SEED = 42

# Functions for logging
def log(msg: str) -> None:
    print(msg)
    TEST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with TEST_LOG.open("a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Function to resolve current model pointer
def resolve_pointer() -> dict:
    p = read_current_model_pointer()
    if not p:
        raise FileNotFoundError("❌ current_model.json missing. Run train.py first.")
    if not p.get("active", {}).get("path"):
        raise FileNotFoundError("❌ current_model.json invalid (missing active.path). Run train.py first.")
    return p

# Function to build labels
def build_labels(df: pd.DataFrame, meta: dict) -> np.ndarray:
    sev = df.get("pulling_severity_raw", df.get("pulling_severity", pd.Series([0] * len(df)))).astype(float)
    aw = df.get("awareness_level_encoded_raw", df.get("awareness_level_encoded", pd.Series([0.0] * len(df)))).astype(float)

    strategy = (meta or {}).get("label_strategy", "rule_based_raw")

    if strategy == "severity_quantiles":
        cut = (meta or {}).get("quantile_cutoffs") or {}
        q1, q2 = cut.get("q1"), cut.get("q2")
        if q1 is None or q2 is None:
            q1, q2 = np.quantile(sev.to_numpy(), [1/3, 2/3])
        y_text = np.where(sev <= float(q1), "low", np.where(sev <= float(q2), "medium", "high"))
    else:
        y_text = np.where((sev >= 7) & (aw <= 0.5), "high", np.where(sev >= 5, "medium", "low"))

    return np.array([LABEL_TO_INT.get(str(t), 0) for t in y_text], dtype=int)

# Function for fallback train-test split
def fallback_split(X: pd.DataFrame, y: np.ndarray):
    uniq, counts = np.unique(y, return_counts=True)
    min_count = int(counts.min()) if len(counts) else 0
    stratify = y if (len(uniq) >= 2 and min_count >= 2) else None
    try:
        return train_test_split(X, y, test_size=0.2, random_state=SEED, stratify=stratify)
    except ValueError:
        return train_test_split(X, y, test_size=0.2, random_state=SEED, stratify=None)

# Main testing function
def main() -> None:
    ensure_artifact_dirs()

    TEST_LOG.parent.mkdir(parents=True, exist_ok=True)
    TEST_LOG.write_text("", encoding="utf-8")

    log("──── TrichMind Testing start ────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found: {DB_PATH}")
    if not FEATURES_JSON.exists():
        raise FileNotFoundError(f"❌ FEATURES_JSON not found: {FEATURES_JSON}")

    pointer = resolve_pointer()
    meta = pointer.get("meta") or {}

    model_path = Path(pointer["active"]["path"])
    if not model_path.exists():
        raise FileNotFoundError(f"❌ Model file not found: {model_path}")

    model = joblib.load(model_path)

    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)

    feature_names = json.loads(FEATURES_JSON.read_text(encoding="utf-8"))
    X = df[feature_names].copy()
    y = build_labels(df, meta)

    split_path = None
    if isinstance(meta, dict) and meta.get("split_path"):
        split_path = Path(meta["split_path"])

    if split_path and split_path.exists():
        split = json.loads(split_path.read_text(encoding="utf-8"))
        test_idx = split.get("test_idx", [])
        if test_idx:
            X_test = X.loc[test_idx]
            y_test = y[np.array(test_idx, dtype=int)]
            log(f"Using saved split → {split_path}")
            log(f"Holdout size: test={len(X_test)}")
            y_pred = model.predict(X_test)
        else:
            log("⚠️ Split file found but test_idx empty. Falling back to fresh split.")
            _, X_test, _, y_test = fallback_split(X, y)
            y_pred = model.predict(X_test)
    else:
        log("⚠️ No saved split_path found in current_model.json. Using fresh split (less comparable).")
        _, X_test, _, y_test = fallback_split(X, y)
        y_pred = model.predict(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, average="weighted", zero_division=0))
    rec = float(recall_score(y_test, y_pred, average="weighted", zero_division=0))
    f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    log(f"Model → {model_path}")
    log(f"LabelStrategy → {meta.get('label_strategy', 'unknown')}")
    log(f"Accuracy={acc:.3f} Precision={prec:.3f} Recall={rec:.3f} F1={f1:.3f}")

    TEST_METRICS_CSV.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ModelPath": str(model_path),
        "TestN": int(len(X_test)),
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1,
        "SplitPathUsed": str(split_path) if split_path else "",
        "LabelStrategy": meta.get("label_strategy", ""),
    }]).to_csv(TEST_METRICS_CSV, index=False)

    TEST_REPORT_TXT.parent.mkdir(parents=True, exist_ok=True)
    TEST_REPORT_TXT.write_text(
        classification_report(y_test, y_pred, target_names=LABELS, zero_division=0),
        encoding="utf-8",
    )

    TEST_HISTORY_CSV.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1,
        "ModelPath": str(model_path),
        "LabelStrategy": meta.get("label_strategy", ""),
    }]).to_csv(TEST_HISTORY_CSV, mode="a", header=not TEST_HISTORY_CSV.exists(), index=False)

    log(f"✅ Metrics → {TEST_METRICS_CSV}")
    log(f"✅ Report  → {TEST_REPORT_TXT}")
    log("──── Testing complete ────")


if __name__ == "__main__":
    main()
