#!/usr/bin/env python3
"""
ml/scripts/model_evaluation.py — TrichMind Evaluation & Visualization (aligned)

Usage:
    python scripts/model_evaluation.py

Outputs (to ml/artifacts/evaluation_outputs):
    - figures/confusion_matrix_combined.png
    - reports/classification_report.csv
    - figures/feature_importances.png (if supported)
    - figures/feature_importance_corr.png (if supported)
"""

from __future__ import annotations

import sys
import json
import sqlite3
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report

ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import (
    DB_PATH,
    FEATURES_JSON,
    EVAL_DIR,
    EVAL_FIG_DIR,
    EVAL_REPORT_DIR,
    ensure_artifact_dirs,
)
from common.model_registry import read_current_model_pointer


# Constants
LABELS = ["low", "medium", "high"]
LABEL_TO_INT = {"low": 0, "medium": 1, "high": 2}
INT_TO_LABEL = {v: k for k, v in LABEL_TO_INT.items()}

# Functions
def resolve_model_and_meta() -> tuple[Path, dict]:
    p = read_current_model_pointer()
    if not p or not p.get("active", {}).get("path"):
        raise FileNotFoundError("❌ current_model.json missing/invalid. Run train.py first.")
    model_path = Path(p["active"]["path"])
    if not model_path.exists():
        raise FileNotFoundError(f"❌ Model file missing: {model_path}")
    return model_path, (p.get("meta") or {})

# Build labels based on severity and awareness level
def build_labels(df: pd.DataFrame, meta: dict) -> list[str]:
    sev = df.get("pulling_severity_raw", df.get("pulling_severity", pd.Series([0] * len(df)))).astype(float)
    aw = df.get("awareness_level_encoded_raw", df.get("awareness_level_encoded", pd.Series([0.0] * len(df)))).astype(float)

    strategy = (meta or {}).get("label_strategy", "rule_based_raw")

    if strategy == "severity_quantiles":
        cut = (meta or {}).get("quantile_cutoffs") or {}
        q1, q2 = cut.get("q1"), cut.get("q2")
        if q1 is None or q2 is None:
            q1, q2 = np.quantile(sev.to_numpy(), [1/3, 2/3])
        y = np.where(sev <= float(q1), "low", np.where(sev <= float(q2), "medium", "high"))
        return y.astype(str).tolist()

    y = np.where((sev >= 7) & (aw <= 0.5), "high", np.where(sev >= 5, "medium", "low"))
    return y.astype(str).tolist()

# Main evaluation function
def main() -> None:
    ensure_artifact_dirs()
    EVAL_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_FIG_DIR.mkdir(parents=True, exist_ok=True)
    EVAL_REPORT_DIR.mkdir(parents=True, exist_ok=True)

    sns.set(style="whitegrid", context="talk")
    print("──── TrichMind Model Evaluation ────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")
    if not FEATURES_JSON.exists():
        raise FileNotFoundError(f"❌ FEATURES_JSON not found at: {FEATURES_JSON}")

    model_path, meta = resolve_model_and_meta()
    model = joblib.load(model_path)

    with sqlite3.connect(DB_PATH) as conn:
        df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)

    feature_names = json.loads(FEATURES_JSON.read_text(encoding="utf-8"))
    X = df[feature_names].copy()

    y_true = build_labels(df, meta)
    y_pred_enc = model.predict(X)
    y_pred = [INT_TO_LABEL.get(int(c), "unknown") for c in y_pred_enc]

    print(f"Model → {model_path}")
    print(f"LabelStrategy → {meta.get('label_strategy', 'unknown')}")
    print(f"Outputs → {EVAL_DIR}")

    cm = confusion_matrix(y_true, y_pred, labels=LABELS)
    cm_norm = confusion_matrix(y_true, y_pred, labels=LABELS, normalize="true")

    fig, ax = plt.subplots(1, 2, figsize=(11, 5))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=LABELS, yticklabels=LABELS, ax=ax[0])
    ax[0].set_title("Confusion Matrix (Counts)")
    ax[0].set_xlabel("Predicted")
    ax[0].set_ylabel("True")

    sns.heatmap(cm_norm, annot=True, fmt=".2f", xticklabels=LABELS, yticklabels=LABELS, ax=ax[1])
    ax[1].set_title("Normalized Confusion Matrix")
    ax[1].set_xlabel("Predicted")
    ax[1].set_ylabel("True")

    out_cm = EVAL_FIG_DIR / "confusion_matrix_combined.png"
    plt.tight_layout()
    plt.savefig(out_cm, dpi=160)
    plt.close()
    print(f"✅ Confusion matrices → {out_cm}")

    report = classification_report(y_true, y_pred, target_names=LABELS, output_dict=True, zero_division=0)
    report_df = pd.DataFrame(report).transpose().round(3)
    out_report = EVAL_REPORT_DIR / "classification_report.csv"
    report_df.to_csv(out_report)
    print(f"✅ Classification report → {out_report}")

    inner_clf = getattr(model, "named_steps", {}).get("clf", model)
    if hasattr(inner_clf, "feature_importances_"):
        feat_imp = pd.Series(inner_clf.feature_importances_, index=feature_names).sort_values(ascending=False)
        top20 = feat_imp.head(20)

        plt.figure(figsize=(8, 6))
        sns.barplot(x=top20.values, y=top20.index)
        plt.title("Top 20 Most Important Features")
        plt.tight_layout()
        out_imp = EVAL_FIG_DIR / "feature_importances.png"
        plt.savefig(out_imp, dpi=160)
        plt.close()
        print(f"✅ Feature importances → {out_imp}")

        corr = df[top20.index].corr()
        plt.figure(figsize=(10, 8))
        sns.heatmap(corr, center=0)
        plt.title("Correlation Among Top 20 Important Features")
        plt.tight_layout()
        out_corr = EVAL_FIG_DIR / "feature_importance_corr.png"
        plt.savefig(out_corr, dpi=160)
        plt.close()
        print(f"✅ Feature correlation heatmap → {out_corr}")
    else:
        print("⚠️ Model has no feature_importances_ — skipping importance plots.")

    print("──── Evaluation complete ────")


if __name__ == "__main__":
    main()
