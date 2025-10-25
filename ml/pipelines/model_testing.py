#!/usr/bin/env python3
"""
model_testing.py — TrichMind Model Holdout Evaluation

Evaluates the saved best relapse-risk model (best_relapse_risk_predictor_model.pkl)
and its label encoder on the holdout (test) dataset.

Outputs (saved under ml/artifacts/testing_outputs/):
    • logs/testing_log.txt
    • metrics_csv/testing_metrics.csv
    • performance_history/testing_performance_history.csv
    • testing_reports/testing_classification_report.txt
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)
from model_training import load_preprocessed, SEED

# ──────────────────────────────
# Paths & Directories
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\artifacts"
TRAIN_ARTIFACTS = os.path.join(BASE_DIR, "training_outputs")
TEST_ARTIFACTS = os.path.join(BASE_DIR, "testing_outputs")

# Directories for model and encoder
MODEL_DIR = os.path.join(TRAIN_ARTIFACTS, "best_models")
ENCODER_DIR = os.path.join(TRAIN_ARTIFACTS, "label_encoder")

# File paths for model and encoder
MODEL_PATH = os.path.join(MODEL_DIR, "best_relapse_risk_predictor_model.pkl")
ENCODER_PATH = os.path.join(ENCODER_DIR, "label_encoder.pkl")

# Output directories for testing artifacts
LOG_DIR = os.path.join(TEST_ARTIFACTS, "logs")
METRICS_DIR = os.path.join(TEST_ARTIFACTS, "metrics_csv")
PERFORMANCE_DIR = os.path.join(TEST_ARTIFACTS, "performance_history")
REPORT_DIR = os.path.join(TEST_ARTIFACTS, "testing_reports")

# Output file paths
LOG_PATH = os.path.join(LOG_DIR, "testing_log.txt")
METRICS_PATH = os.path.join(METRICS_DIR, "testing_metrics.csv")
HISTORY_PATH = os.path.join(PERFORMANCE_DIR, "testing_performance_history.csv")
REPORT_PATH = os.path.join(REPORT_DIR, "testing_classification_report.txt")

# Ensure all directories exist
for d in [TEST_ARTIFACTS, LOG_DIR, METRICS_DIR, PERFORMANCE_DIR, REPORT_DIR]:
    os.makedirs(d, exist_ok=True)

# ──────────────────────────────
# Logger
# ──────────────────────────────
def log(msg: str):
    """Logs both to console and file."""
    print(msg)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Reset log safely
open(LOG_PATH, "w").close()

start_time = datetime.now()
log("────────────────────────────────────────────────────────")
log(f"🧠 TrichMind Model Testing — {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
log(f"📂 Model Path: {MODEL_PATH}")
log("────────────────────────────────────────────────────────")

# ──────────────────────────────
# ASCII Trend Drawer
# ──────────────────────────────
def draw_ascii_trend(history_path: str):
    """Render text-based trend for Accuracy & F1 from test history."""
    if not os.path.exists(history_path):
        log("📉 No previous testing history found — first run.")
        return

    hist = pd.read_csv(history_path)
    if hist.empty or "Accuracy" not in hist.columns:
        log("⚠️ Testing history is empty.")
        return

    log("\n📈 Testing Performance Trend (last 10 runs):")
    for _, row in hist.tail(10).iterrows():
        acc_bar = "█" * int(row["Accuracy"] * 50)
        f1_bar = "▒" * int(row["F1"] * 50)
        log(f"{row['Date']} | Acc: {row['Accuracy']:.3f} {acc_bar}")
        log(f"{' ' * 21} | F1 : {row['F1']:.3f} {f1_bar}")
    log("────────────────────────────────────────────────────────")

# ──────────────────────────────
# Load Model & Data
# ──────────────────────────────
try:
    log("🚀 Loading best model and label encoder...")
    model = joblib.load(MODEL_PATH)
    le = joblib.load(ENCODER_PATH)
except Exception as e:
    log(f"❌ Error loading model or encoder: {e}")
    raise SystemExit(e)

try:
    log("📂 Loading preprocessed dataset...")
    df = load_preprocessed()
    if df.empty:
        raise ValueError("Preprocessed dataset is empty.")
    if "relapse_risk_tag" not in df.columns:
        raise KeyError("'relapse_risk_tag' missing in dataset.")
except Exception as e:
    log(f"❌ Error loading dataset: {e}")
    raise SystemExit(e)

# ──────────────────────────────
# Encode Target & Prepare Test Split
# ──────────────────────────────
try:
    y = df["relapse_risk_tag"].astype(str)
    le2 = LabelEncoder().fit(y)
    y_enc = le2.transform(y)
    X = df.select_dtypes(include=[np.number])

    _, X_test, _, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=SEED
    )
except Exception as e:
    log(f"❌ Error preparing test data: {e}")
    raise SystemExit(e)

# ──────────────────────────────
# Predict & Evaluate
# ──────────────────────────────
log("🔍 Running predictions on test set...")
try:
    y_pred = model.predict(X_test)
except Exception as e:
    log(f"❌ Prediction error: {e}")
    raise SystemExit(e)

# ──────────────────────────────
# Metrics Computation
# ──────────────────────────────
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

log("\n📊 Model Performance on Test Set:")
log(f"   Accuracy : {acc:.3f}")
log(f"   Precision: {prec:.3f}")
log(f"   Recall   : {rec:.3f}")
log(f"   F1-score : {f1:.3f}")

# ──────────────────────────────
# Detailed Classification Report
# ──────────────────────────────
try:
    report = classification_report(y_test, y_pred, target_names=le2.classes_, zero_division=0)
    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)
    log("\n🧩 Detailed Classification Report saved → " + REPORT_PATH)
except Exception as e:
    log(f"⚠️ Could not generate classification report: {e}")

# ──────────────────────────────
# Save Testing Metrics
# ──────────────────────────────
try:
    metrics_df = pd.DataFrame([{
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1
    }])
    metrics_df.to_csv(METRICS_PATH, index=False)
    log(f"\n✅ Testing metrics saved → {METRICS_PATH}")

    # Append to history
    history_entry = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1
    }])
    history_entry.to_csv(HISTORY_PATH, mode="a", index=False, header=not os.path.exists(HISTORY_PATH))
    log(f"📈 Testing history updated → {HISTORY_PATH}")
except Exception as e:
    log(f"⚠️ Could not save metrics CSV: {e}")

# ──────────────────────────────
# Wrap-up + ASCII Trend
# ──────────────────────────────
runtime = (datetime.now() - start_time).total_seconds()
log(f"\n⏱️ Total Runtime: {runtime:.2f} seconds")
log(f"📝 Log saved → {LOG_PATH}")
draw_ascii_trend(HISTORY_PATH)
log("🎉 Model testing completed successfully.")
log("────────────────────────────────────────────────────────")
