#!/usr/bin/env python3
"""
model_validation.py — TrichMind Model Evaluation, Metrics, and Visualization

Evaluates the trained relapse-risk prediction model using:
    - ROC curves (multi-class compatible)
    - Confusion matrix
    - Accuracy, Precision, Recall, F1-score, and AUC metrics
    - ASCII trend chart of validation performance

Outputs (saved under ml/artifacts/validation_outputs/):
    • figures/png/roc.png
    • figures/png/confusion.png
    • metrics/validation_metrics.csv
    • metrics/validation_performance_history.csv
    • logs/validation_log.txt
"""

import os
import joblib
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, label_binarize
from sklearn.metrics import (
    confusion_matrix,
    roc_curve,
    auc,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)
from model_training import load_preprocessed, SEED

# ──────────────────────────────
# Paths & Directories
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\artifacts"
VALIDATION_DIR = os.path.join(BASE_DIR, "validation_outputs")

FIG_DIR = os.path.join(VALIDATION_DIR, "figure-png")
LOG_DIR = os.path.join(VALIDATION_DIR, "logs")
METRICS_DIR = os.path.join(VALIDATION_DIR, "metrics_csv")
PERFORMANCE_DIR = os.path.join(VALIDATION_DIR, "performance_history")

MODEL_DIR = os.path.join(BASE_DIR, "training_outputs", "best_models")
MODEL_PATH = os.path.join(MODEL_DIR, "best_relapse_risk_predictor_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "training_outputs", "label_encoder", "label_encoder.pkl")

ROC_PATH = os.path.join(FIG_DIR, "roc.png")
CONF_PATH = os.path.join(FIG_DIR, "confusion.png")
METRICS_PATH = os.path.join(METRICS_DIR, "validation_metrics.csv")
HISTORY_PATH = os.path.join(PERFORMANCE_DIR, "validation_performance_history.csv")
LOG_PATH = os.path.join(LOG_DIR, "validation_log.txt")

# Ensure directories exist
for d in [FIG_DIR, LOG_DIR, METRICS_DIR, PERFORMANCE_DIR]:
    os.makedirs(d, exist_ok=True)

# ──────────────────────────────
# Logging Helper
# ──────────────────────────────
def log(msg: str):
    print(msg)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

if os.path.exists(LOG_PATH):
    os.remove(LOG_PATH)

start_time = datetime.now()
log("────────────────────────────────────────────────────────")
log(f"🧪 TrichMind Model Validation — {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
log(f"📂 Model Path: {MODEL_PATH}")
log("────────────────────────────────────────────────────────")

# ──────────────────────────────
# ASCII Trend Drawer
# ──────────────────────────────
def draw_ascii_trend(history_path: str):
    """Render a text-based trend for Accuracy & F1 from validation history."""
    if not os.path.exists(history_path):
        log("📉 No validation history found yet — first run.")
        return

    hist = pd.read_csv(history_path)
    if hist.empty or "Accuracy" not in hist.columns:
        log("⚠️ Validation history is empty.")
        return

    log("\n📈 Validation Performance Trend (last 10 runs):")
    for _, row in hist.tail(10).iterrows():
        acc_bar = "█" * int(row["Accuracy"] * 50)
        f1_bar = "▒" * int(row["F1"] * 50)
        log(f"{row['Date']} | Acc: {row['Accuracy']:.3f} {acc_bar}")
        log(f"{' ' * 21} | F1 : {row['F1']:.3f} {f1_bar}")
    log("────────────────────────────────────────────────────────")

# ──────────────────────────────
# Load model and data
# ──────────────────────────────
try:
    log("🚀 Loading model and encoder...")
    model = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)
except Exception as e:
    log(f"❌ Failed to load model or encoder: {e}")
    raise SystemExit(e)

try:
    log("📂 Loading preprocessed dataset...")
    df = load_preprocessed()
    if "relapse_risk_tag" not in df.columns:
        raise KeyError("'relapse_risk_tag' column missing in dataset.")
except Exception as e:
    log(f"❌ Failed to load dataset: {e}")
    raise SystemExit(e)

# ──────────────────────────────
# Prepare test data
# ──────────────────────────────
y = df["relapse_risk_tag"].astype(str)
le_val = LabelEncoder().fit(y)
y_enc = le_val.transform(y)
X = df.select_dtypes(include=[np.number])

_, X_test, _, y_test = train_test_split(
    X, y_enc, test_size=0.2, stratify=y_enc, random_state=SEED
)

# ──────────────────────────────
# Predictions
# ──────────────────────────────
log("📈 Generating predictions and probabilities...")
try:
    y_prob = model.predict_proba(X_test)
except Exception:
    log("⚠️ Model does not support predict_proba; using uniform fallback.")
    y_prob = np.full((len(X_test), len(le_val.classes_)), 1 / len(le_val.classes_))

try:
    y_pred = model.predict(X_test)
except Exception as e:
    log(f"❌ Prediction error: {e}")
    raise SystemExit(e)

# ──────────────────────────────
# Compute Metrics
# ──────────────────────────────
log("📊 Computing evaluation metrics...")

n_classes = len(le_val.classes_)
metrics_data = []

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

metrics_data.append({
    "Class": "Overall",
    "Accuracy": acc,
    "Precision": prec,
    "Recall": rec,
    "F1": f1,
    "AUC": np.nan,
})

# Multi-class ROC & per-class metrics
if n_classes > 2:
    y_bin = label_binarize(y_test, classes=list(range(n_classes)))
    for i, cls in enumerate(le_val.classes_):
        try:
            fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
            auc_score = auc(fpr, tpr)
        except Exception:
            auc_score = np.nan
        cls_prec = precision_score(y_test, y_pred, labels=[i], average="macro", zero_division=0)
        cls_rec = recall_score(y_test, y_pred, labels=[i], average="macro", zero_division=0)
        cls_f1 = f1_score(y_test, y_pred, labels=[i], average="macro", zero_division=0)
        metrics_data.append({
            "Class": cls,
            "Accuracy": np.nan,
            "Precision": cls_prec,
            "Recall": cls_rec,
            "F1": cls_f1,
            "AUC": auc_score,
        })
else:
    try:
        fpr, tpr, _ = roc_curve(y_test, y_prob[:, 1])
        auc_score = auc(fpr, tpr)
    except Exception:
        auc_score = np.nan
    metrics_data.append({
        "Class": le_val.classes_[1] if len(le_val.classes_) > 1 else "Class_1",
        "Accuracy": np.nan,
        "Precision": prec,
        "Recall": rec,
        "F1": f1,
        "AUC": auc_score,
    })

metrics_df = pd.DataFrame(metrics_data)
metrics_df.to_csv(METRICS_PATH, index=False)
log(f"✅ Validation metrics saved → {METRICS_PATH}")

# Append to validation history
history_entry = pd.DataFrame([{
    "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    "Accuracy": acc,
    "Precision": prec,
    "Recall": rec,
    "F1": f1,
}])
history_entry.to_csv(HISTORY_PATH, mode="a", index=False, header=not os.path.exists(HISTORY_PATH))
log(f"📈 Validation history updated → {HISTORY_PATH}")

# ──────────────────────────────
# ROC Curve
# ──────────────────────────────
log("📉 Generating ROC curve visualization...")
plt.figure(figsize=(6, 6))
if n_classes > 2:
    y_bin = label_binarize(y_test, classes=list(range(n_classes)))
    for i, cls in enumerate(le_val.classes_):
        try:
            fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
            plt.plot(fpr, tpr, label=f"{cls.capitalize()} (AUC={auc(fpr, tpr):.2f})")
        except Exception:
            continue
else:
    fpr, tpr, _ = roc_curve(y_test, y_prob[:, 1])
    plt.plot(fpr, tpr, label=f"{le_val.classes_[1]} (AUC={auc(fpr, tpr):.2f})")

plt.plot([0, 1], [0, 1], "k--", linewidth=1)
plt.title("ROC Curve — TrichMind Relapse Risk Model")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.legend(loc="lower right", fontsize=8)
plt.tight_layout()
plt.savefig(ROC_PATH, dpi=150)
plt.close()
log(f"✅ ROC curve saved → {ROC_PATH}")

# ──────────────────────────────
# Confusion Matrix
# ──────────────────────────────
log("📊 Generating confusion matrix...")
cm = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(5, 5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=le_val.classes_,
    yticklabels=le_val.classes_,
    ax=ax
)
ax.set_title("Confusion Matrix — TrichMind Model")
ax.set_xlabel("Predicted")
ax.set_ylabel("True")
plt.tight_layout()
plt.savefig(CONF_PATH, dpi=150)
plt.close()
log(f"✅ Confusion matrix saved → {CONF_PATH}")

# ──────────────────────────────
# Wrap-up
# ──────────────────────────────
runtime = (datetime.now() - start_time).total_seconds()
log("\n✅ Validation Complete!")
log(f"📈 Overall Accuracy: {acc:.3f}")
log("📋 Summary:")
log(metrics_df.to_string(index=False))
log(f"⏱️ Runtime: {runtime:.2f} seconds")
log(f"📝 Log saved → {LOG_PATH}")
draw_ascii_trend(HISTORY_PATH)
log("🎉 Validation finished successfully!")
log("────────────────────────────────────────────────────────")
