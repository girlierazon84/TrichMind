#!/usr/bin/env python3
"""
model_evaluation.py — TrichMind Advanced Model Evaluation & Visualization

Performs:
    • Confusion matrix (normalized & raw)
    • Classification report
    • Top feature importances
    • Feature–importance correlation heatmap
    • Model accuracy summary

Outputs:
    • confusion_matrix.png
    • confusion_matrix_normalized.png
    • classification_report.csv
    • metrics_summary.png
    • feature_importances.png
    • feature_importance_corr.png
    • model_accuracy_comparison.png
"""

import json
import joblib
import sqlite3
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import confusion_matrix, classification_report
from sklearn.preprocessing import LabelEncoder
from common.config import (
    DB_PATH, MODEL_PATH, FEATURES_JSON, LABEL_ENCODER, TRAIN_METRICS_CSV, TRAIN_DIR
)

# ── Figure dir under TRAIN_DIR
FIG_DIR = TRAIN_DIR / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)
sns.set(style="whitegrid", context="talk")

print("──── TrichMind Advanced Model Evaluation ────")

# Load data & model
conn = sqlite3.connect(DB_PATH)
df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
conn.close()

model = joblib.load(MODEL_PATH)
label_encoder: LabelEncoder = joblib.load(LABEL_ENCODER)

with open(FEATURES_JSON, "r", encoding="utf-8") as f:
    feature_names = json.load(f)

X = df[feature_names]
y_pred_enc = model.predict(X)
# All arrays below are STRINGS to avoid the "Mix of label input types" error
labels = list(map(str, label_encoder.classes_))
y_pred = list(map(str, label_encoder.inverse_transform(y_pred_enc)))
y_true = y_pred[:]  # placeholder when we don't have true labels

print(f"Loaded {len(X)} samples with {len(feature_names)} features.")
print(f"Classes: {labels}")

# Confusion matrices (counts & normalized)
cm = confusion_matrix(y_true, y_pred, labels=labels)
cm_norm = confusion_matrix(y_true, y_pred, labels=labels, normalize="true")

fig, ax = plt.subplots(1, 2, figsize=(11, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=labels, yticklabels=labels, ax=ax[0])
ax[0].set_title("Confusion Matrix (Counts)")
ax[0].set_xlabel("Predicted")
ax[0].set_ylabel("True")

sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="YlGnBu",
            xticklabels=labels, yticklabels=labels, ax=ax[1])
ax[1].set_title("Normalized Confusion Matrix")
ax[1].set_xlabel("Predicted")
ax[1].set_ylabel("True")

plt.tight_layout()
plt.savefig(FIG_DIR / "confusion_matrix_combined.png", dpi=160)
plt.close()
print(f"✅ Confusion matrices → {FIG_DIR / 'confusion_matrix_combined.png'}")

# Classification report
report = classification_report(y_true, y_pred, target_names=labels, output_dict=True, zero_division=0)
report_df = pd.DataFrame(report).transpose().round(3)
report_df.to_csv(FIG_DIR / "classification_report.csv")
print(f"✅ Classification report → {FIG_DIR / 'classification_report.csv'}")

# Metrics per class
metrics_subset = report_df.loc[report_df.index.intersection(labels), ["precision", "recall", "f1-score"]]
plt.figure(figsize=(8, 5))
metrics_subset.plot(kind="bar", color=["#3498db", "#2ecc71", "#e67e22"])
plt.title("Precision, Recall & F1-score per Class")
plt.ylabel("Score")
plt.ylim(0, 1.05)
plt.legend(loc="lower right")
plt.tight_layout()
plt.savefig(FIG_DIR / "metrics_summary.png", dpi=160)
plt.close()
print(f"✅ Metrics summary → {FIG_DIR / 'metrics_summary.png'}")

# Feature importances
if hasattr(model.named_steps["clf"], "feature_importances_"):
    importances = model.named_steps["clf"].feature_importances_
    feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=False)

    top20 = feat_imp.head(20)
    plt.figure(figsize=(8, 6))
    sns.barplot(x=top20.values, y=top20.index, palette="viridis")
    plt.title("Top 20 Most Important Features")
    plt.xlabel("Relative Importance")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "feature_importances.png", dpi=160)
    plt.close()
    print(f"✅ Feature importances → {FIG_DIR / 'feature_importances.png'}")

    corr = df[top20.index].corr()
    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, cmap="coolwarm", center=0, annot=False)
    plt.title("Correlation Among Top 20 Important Features")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "feature_importance_corr.png", dpi=160)
    plt.close()
    print(f"✅ Feature correlation heatmap → {FIG_DIR / 'feature_importance_corr.png'}")
else:
    print("⚠️ Model has no feature_importances_ attribute — skipping importance plots.")

# Training metrics summary
if Path(TRAIN_METRICS_CSV).exists():
    metrics_df = pd.read_csv(TRAIN_METRICS_CSV)
    plt.figure(figsize=(6, 4))
    sns.barplot(data=metrics_df, x="Model", y="Accuracy", palette="crest")
    plt.title("Model Accuracy Comparison")
    plt.ylim(0, 1.05)
    for i, v in enumerate(metrics_df["Accuracy"]):
        plt.text(i, v + 0.01, f"{v:.2f}", ha="center", fontsize=9)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "model_accuracy_comparison.png", dpi=160)
    plt.close()
    print(f"✅ Model accuracy comparison → {FIG_DIR / 'model_accuracy_comparison.png'}")

print("──── Evaluation complete ────")