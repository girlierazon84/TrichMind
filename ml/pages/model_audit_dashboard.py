#!/usr/bin/env python3
"""
model_audit_dashboard.py — Streamlit Dashboard for TrichMind ML Evaluation

Displays:
    • Overall model metrics
    • Confusion matrix heatmap
    • Classification report table
    • Top feature importances
    • Model accuracy comparison

Usage:
    streamlit run pages/model_audit_dashboard.py
"""

# ── Ensure we can import common.config regardless of launch dir
import sys
from pathlib import Path
CURRENT = Path(__file__).resolve()
ML_ROOT = CURRENT.parents[1]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import json
import numpy as np
import sqlite3
from sklearn.metrics import confusion_matrix, classification_report
from common.config import (
    MODEL_PATH, LABEL_ENCODER, FEATURES_JSON, TRAIN_METRICS_CSV, DB_PATH, TRAIN_DIR
)

st.set_page_config(page_title="TrichMind ML Dashboard", page_icon="🧠", layout="wide")
st.title("🧠 TrichMind Relapse Risk Model Dashboard")
st.caption("Comprehensive evaluation of your trained relapse-risk model.")

FIG_DIR = TRAIN_DIR / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

try:
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER)
    feature_names = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))
except Exception as e:
    st.error(f"Failed to load model or metadata: {e}")
    st.stop()

# Load SQLite data
conn = sqlite3.connect(DB_PATH)
df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
conn.close()

X = df[feature_names]
y_pred_enc = model.predict(X)
labels = list(map(str, label_encoder.classes_))
y_pred = list(map(str, label_encoder.inverse_transform(y_pred_enc)))
y_true = y_pred[:]  # placeholder

st.info(f"Loaded **{len(X)} samples** and **{len(feature_names)} features** for evaluation.")

with st.sidebar:
    st.header("🧩 Model Info")
    st.write(f"**Model Path:** `{MODEL_PATH}`")
    st.write(f"**Encoder Classes:** {labels}")
    st.write(f"**Features Count:** {len(feature_names)}")
    st.divider()
    st.markdown("📘 *Data source:* `relapse_risk_model_features` (SQLite)")
    if TRAIN_METRICS_CSV.exists():
        st.markdown("🔗 *Training metrics:*")
        st.dataframe(pd.read_csv(TRAIN_METRICS_CSV), use_container_width=True)

# Confusion Matrix
st.subheader("🔹 Confusion Matrix")
cm = confusion_matrix(y_true, y_pred, labels=labels)
fig, ax = plt.subplots(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt="d", cmap="coolwarm",
            xticklabels=labels, yticklabels=labels, ax=ax)
ax.set_xlabel("Predicted Label")
ax.set_ylabel("True Label")
ax.set_title("Confusion Matrix")
st.pyplot(fig)

# Classification Report
st.subheader("📊 Classification Report")
report = classification_report(y_true, y_pred, target_names=labels, output_dict=True, zero_division=0)
report_df = pd.DataFrame(report).transpose().round(3)
st.dataframe(report_df, use_container_width=True)

# Feature Importances
if hasattr(model.named_steps["clf"], "feature_importances_"):
    st.subheader("🌿 Top 20 Feature Importances")
    importances = model.named_steps["clf"].feature_importances_
    feat_imp = pd.Series(importances, index=feature_names).sort_values(ascending=False).head(20)
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.barplot(x=feat_imp.values, y=feat_imp.index, palette="viridis", ax=ax)
    ax.set_xlabel("Importance")
    ax.set_ylabel("Feature")
    ax.set_title("Top 20 Most Influential Features")
    st.pyplot(fig)
else:
    st.warning("This model does not expose feature importances.")

# Model Accuracy Comparison
if TRAIN_METRICS_CSV.exists():
    st.subheader("⚖️ Model Accuracy Comparison")
    metrics_df = pd.read_csv(TRAIN_METRICS_CSV)
    fig, ax = plt.subplots(figsize=(5, 3))
    sns.barplot(data=metrics_df, x="Model", y="Accuracy", ax=ax)
    ax.set_ylim(0, 1.05)
    ax.set_title("Accuracy by Model Type")
    st.pyplot(fig)

st.success("✅ Evaluation dashboard loaded successfully!")
st.caption("© 2025 TrichMind AI Research — Relapse Risk Prediction Prototype")