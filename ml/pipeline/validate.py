#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import sqlite3
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, label_binarize
from sklearn.metrics import confusion_matrix, roc_curve, auc, accuracy_score, precision_score, recall_score, f1_score

from ml.common.config import (
DB_PATH, FEATURES_JSON, MODEL_PATH, LABEL_ENCODER,
VAL_LOG, VAL_METRICS_CSV, VAL_HISTORY_CSV, VAL_ROC_PNG, VAL_CONF_PNG
)


# Random seed for reproducibility
SEED = 42

# Load dataset
def log(msg: str) -> None:
    print(msg)
    VAL_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(VAL_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Clear previous logs
open(VAL_LOG, "w").close()
log("──── Validation start ────")

# Data
conn = sqlite3.connect(DB_PATH)
df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
conn.close()
features = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))

# Target via encoder order (low, medium, high)
le: LabelEncoder = joblib.load(LABEL_ENCODER)
# reconstruct textual labels from rule to match training
sev = df.get("pulling_severity", pd.Series([0]*len(df)))
aw = df.get("awareness_level_encoded", pd.Series([0.0]*len(df)))
y_text = np.where((sev >= 7) & (aw <= 0.5), "high", np.where(sev >= 5, "medium", "low"))
y = le.transform(y_text)
X = df[features].copy()

# Split
a, X_test, b, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)

# Model
model = joblib.load(MODEL_PATH)

# Predict
try:
    y_prob = model.predict_proba(X_test)
except Exception:
    y_prob = np.full((len(X_test), len(le.classes_)), 1/len(le.classes_))

# Predict classes
y_pred = model.predict(X_test)

# Metrics
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

# Log metrics
rows = [{"Class":"Overall","Accuracy":acc,"Precision":prec,"Recall":rec,"F1":f1,"AUC":np.nan}]

# ROC multi-class
n = len(le.classes_)
plt.figure(figsize=(6,6))
if n > 2:
    y_bin = label_binarize(y_test, classes=list(range(n)))
    for i, cls in enumerate(le.classes_):
        fpr, tpr, _ = roc_curve(y_bin[:, i], y_prob[:, i])
        plt.plot(fpr, tpr, label=f"{cls} (AUC={auc(fpr,tpr):.2f})")
else:
    fpr, tpr, _ = roc_curve(y_test, y_prob[:, 1])
# Plot ROC curve for binary
plt.plot(fpr, tpr, label=f"{le.classes_[1]} (AUC={auc(fpr,tpr):.2f})")
plt.plot([0,1],[0,1],"k--", linewidth=1)
plt.title("ROC Curve — TrichMind")
plt.xlabel("FPR"); plt.ylabel("TPR"); plt.legend(loc="lower right", fontsize=8)
plt.tight_layout(); plt.savefig(VAL_ROC_PNG, dpi=160); plt.close()

# Confusion
cm = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(5,5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", xticklabels=le.classes_, yticklabels=le.classes_, ax=ax)
ax.set_title("Confusion Matrix – TrichMind"); ax.set_xlabel("Predicted"); ax.set_ylabel("True")
plt.tight_layout(); plt.savefig(VAL_CONF_PNG, dpi=160); plt.close()

# Save
pd.DataFrame(rows).to_csv(VAL_METRICS_CSV, index=False)
pd.DataFrame([{ "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Accuracy":acc, "Precision":prec, "Recall":rec, "F1":f1 }]).to_csv(VAL_HISTORY_CSV, mode="a", header=not VAL_HISTORY_CSV.exists(), index=False)

# Log summary
log(f"Acc={acc:.3f} F1={f1:.3f}")
log(f"ROC → {VAL_ROC_PNG}")
log(f"CM → {VAL_CONF_PNG}")
log(f"Metrics → {VAL_METRICS_CSV}")
log("──── Validation complete ────")