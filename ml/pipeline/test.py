#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import sqlite3
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

from ml.common.config import (
DB_PATH, FEATURES_JSON, MODEL_PATH, LABEL_ENCODER,
TEST_LOG, TEST_METRICS_CSV, TEST_HISTORY_CSV, TEST_REPORT_TXT
)


# Random seed for reproducibility
SEED = 42

# Load features configuration
def log(msg: str) -> None:
    print(msg)
    TEST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(TEST_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

open(TEST_LOG, "w").close()
log("──── Testing start ────")

# Load dataset from SQLite database
conn = sqlite3.connect(DB_PATH)
df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
conn.close()
features = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
le: LabelEncoder = joblib.load(LABEL_ENCODER)

# Prepare target variable
sev = df.get("pulling_severity", pd.Series([0]*len(df)))
aw = df.get("awareness_level_encoded", pd.Series([0.0]*len(df)))
y_text = np.where((sev >= 7) & (aw <= 0.5), "high", np.where(sev >= 5, "medium", "low"))
y = le.transform(y_text)
X = df[features].copy()

# Split data into training and testing sets
_, X_test, _, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)

# Load the trained model and make predictions
model = joblib.load(MODEL_PATH)
y_pred = model.predict(X_test)

# Calculate evaluation metrics
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

# Save evaluation metrics
pd.DataFrame([{ "Accuracy":acc, "Precision":prec, "Recall":rec, "F1":f1 }]).to_csv(TEST_METRICS_CSV, index=False)

# Generate and save classification report
try:
    rep = classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0)
    TEST_REPORT_TXT.parent.mkdir(parents=True, exist_ok=True)
    with open(TEST_REPORT_TXT, "w", encoding="utf-8") as f:
        f.write(rep)
except Exception:
    pass

# Log test history
pd.DataFrame([{ "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Accuracy":acc, "Precision":prec, "Recall":rec, "F1":f1 }]).to_csv(TEST_HISTORY_CSV, mode="a", header=not TEST_HISTORY_CSV.exists(), index=False)

# Log results
log(f"Acc={acc:.3f} F1={f1:.3f}")
log(f"Metrics → {TEST_METRICS_CSV}")
log(f"Report → {TEST_REPORT_TXT}")
log("──── Testing complete ────")