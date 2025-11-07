#!/usr/bin/env python3
"""
model_audit_dashboard.py — TrichMind Interactive Model Audit (Streamlit)

Aligned with fixed mapping:
    0 -> 'low', 1 -> 'medium', 2 -> 'high'

Shows:
    • Dataset and model info
    • Class mapping sanity panel (model classes vs label names)
    • Confusion matrices (raw & normalized, using y_pred as placeholder y_true)
    • Classification report table
    • Top-20 feature importances + correlation heatmap (if available)
    • Training metrics comparison
    • (Optional) Try a single prediction inline (uses same API logic)

Run (from ml/):
    streamlit run pages/model_audit_dashboard.py
"""

from __future__ import annotations
import json
from pathlib import Path
import sys
import sqlite3
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
import streamlit as st
from sklearn.metrics import confusion_matrix, classification_report

# ────────────────────────────────────────────────────────────
# Allow running from repo root or /ml by adding ml/ to sys.path
# ────────────────────────────────────────────────────────────
HERE = Path(__file__).resolve()
ML_ROOT = HERE.parents[1] if HERE.name == "model_audit_dashboard.py" else HERE.parents[0]
if str(ML_ROOT) not in sys.path:
    sys.path.insert(0, str(ML_ROOT))

from common.config import (
    DB_PATH, MODEL_PATH, LABEL_ENCODER, FEATURES_JSON,
    TRAIN_METRICS_CSV, TRAIN_DIR
)

# ────────────────────────────────────────────────────────────
# Streamlit page config
# ────────────────────────────────────────────────────────────
st.set_page_config(page_title="TrichMind Model Audit", page_icon="🧠", layout="wide")
st.title("🧠 TrichMind — Model Audit Dashboard")
st.caption("Aligned with fixed label mapping (`low=0`, `medium=1`, `high=2`).")

sns.set(style="whitegrid", context="talk")
FIG_DIR = TRAIN_DIR / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

LABELS = ["low", "medium", "high"]
NUM_TO_LABEL = {0: "low", 1: "medium", 2: "high"}

# ────────────────────────────────────────────────────────────
# Load artifacts
# ────────────────────────────────────────────────────────────
@st.cache_data(show_spinner=False)
def load_features() -> list[str]:
    with open(FEATURES_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

@st.cache_resource(show_spinner=True)
def load_model_and_encoder():
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(LABEL_ENCODER)
    # Try to read the classifier inside a pipeline, else direct model
    inner = getattr(model, "named_steps", {}).get("clf", model)
    model_classes = getattr(inner, "classes_", np.array([0, 1, 2]))
    return model, encoder, inner, np.array(model_classes)

@st.cache_data(show_spinner=False)
def load_table():
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
    conn.close()
    return df

@st.cache_data(show_spinner=False)
def load_train_metrics():
    if Path(TRAIN_METRICS_CSV).exists():
        return pd.read_csv(TRAIN_METRICS_CSV)
    return None

# actual loads
try:
    features = load_features()
    model, label_encoder, inner_clf, model_numeric_classes = load_model_and_encoder()
    df = load_table()
except Exception as e:
    st.error(f"Failed to load artifacts or data: {e}")
    st.stop()

X = df[features]
st.info(f"Loaded **{len(X)} samples** with **{len(features)} features** from `{DB_PATH.name}`.")
st.write(f"**Model:** `{MODEL_PATH.name}`  |  **Encoder classes:** `{list(label_encoder.classes_)}`  |  **Model numeric classes:** `{list(map(int, model_numeric_classes))}`")

# ────────────────────────────────────────────────────────────
# Sidebar — quick info & dataset peek
# ────────────────────────────────────────────────────────────
with st.sidebar:
    st.header("🧩 Artifacts")
    st.code(f"MODEL_PATH      = {MODEL_PATH}")
    st.code(f"LABEL_ENCODER   = {LABEL_ENCODER}")
    st.code(f"FEATURES_JSON   = {FEATURES_JSON}")
    st.code(f"DB_PATH         = {DB_PATH}")
    st.code(f"TRAIN_METRICS   = {TRAIN_METRICS_CSV}")
    st.divider()
    with st.expander("🔎 Peek features.json"):
        st.text_area("features.json", value=json.dumps(features, indent=2), height=260)
    with st.expander("🗂️ Dataset sample"):
        st.dataframe(df.head(20), use_container_width=True)

# ────────────────────────────────────────────────────────────
# Class mapping sanity
# ────────────────────────────────────────────────────────────
st.subheader("🔧 Class Mapping Sanity Check")
m1, m2 = st.columns([1, 1])
with m1:
    st.markdown("**Expected mapping (fixed):**")
    st.table(pd.DataFrame({"numeric": [0, 1, 2], "label": LABELS}))
with m2:
    enc_labels = list(map(str, label_encoder.classes_))
    st.markdown("**LabelEncoder classes (string order):**")
    st.table(pd.DataFrame({"encoder_order": enc_labels}))

st.caption(
    "Model predicts numeric classes; we display labels via a fixed mapping `{0:'low', 1:'medium', 2:'high'}` "
    "and use this consistent order for evaluation plots."
)

# ────────────────────────────────────────────────────────────
# Predictions & placeholders for y_true
# ────────────────────────────────────────────────────────────
y_pred_enc = model.predict(X)
y_pred_labels = [NUM_TO_LABEL.get(int(c), "unknown") for c in y_pred_enc]

# If you do NOT yet have ground-truth labels, we use y_pred as a placeholder for y_true
y_true_labels = y_pred_labels[:]

# ────────────────────────────────────────────────────────────
# Confusion matrices
# ────────────────────────────────────────────────────────────
st.subheader("📉 Confusion Matrices")
cm = confusion_matrix(y_true_labels, y_pred_labels, labels=LABELS)
cm_norm = confusion_matrix(y_true_labels, y_pred_labels, labels=LABELS, normalize="true")

fig, ax = plt.subplots(1, 2, figsize=(12, 5))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=LABELS, yticklabels=LABELS, ax=ax[0])
ax[0].set_title("Counts")
ax[0].set_xlabel("Predicted")
ax[0].set_ylabel("True")

sns.heatmap(cm_norm, annot=True, fmt=".2f", cmap="YlGnBu",
            xticklabels=LABELS, yticklabels=LABELS, ax=ax[1])
ax[1].set_title("Normalized (by true)")
ax[1].set_xlabel("Predicted")
ax[1].set_ylabel("True")

st.pyplot(fig)

# ────────────────────────────────────────────────────────────
# Classification report
# ────────────────────────────────────────────────────────────
st.subheader("📊 Classification Report")
report = classification_report(y_true_labels, y_pred_labels, target_names=LABELS, output_dict=True, zero_division=0)
report_df = pd.DataFrame(report).transpose().round(3)
st.dataframe(report_df, use_container_width=True)

# per-class metrics chart
metrics_subset = report_df.loc[report_df.index.intersection(LABELS), ["precision", "recall", "f1-score"]]
fig2, ax2 = plt.subplots(figsize=(8, 5))
metrics_subset.plot(kind="bar", ax=ax2, color=["#3498db", "#2ecc71", "#e67e22"])
ax2.set_title("Precision, Recall & F1-score per Class")
ax2.set_ylabel("Score")
ax2.set_ylim(0, 1.05)
ax2.legend(loc="lower right")
st.pyplot(fig2)

# ────────────────────────────────────────────────────────────
# Feature importances (if supported)
# ────────────────────────────────────────────────────────────
st.subheader("🌿 Feature Importances")
if hasattr(inner_clf, "feature_importances_"):
    importances = inner_clf.feature_importances_
    feat_imp = pd.Series(importances, index=features).sort_values(ascending=False)
    top_n = st.slider("Top N features", min_value=5, max_value=40, value=20, step=1)

    topk = feat_imp.head(top_n)
    fig3, ax3 = plt.subplots(figsize=(9, 0.35 * top_n + 2))
    sns.barplot(x=topk.values, y=topk.index, palette="viridis", ax=ax3)
    ax3.set_title(f"Top {top_n} Most Important Features")
    ax3.set_xlabel("Relative Importance")
    ax3.set_ylabel("Feature")
    st.pyplot(fig3)

    # correlation among top features
    corr = df[topk.index].corr()
    fig4, ax4 = plt.subplots(figsize=(10, 8))
    sns.heatmap(corr, cmap="coolwarm", center=0, ax=ax4)
    ax4.set_title(f"Correlation Among Top {top_n} Important Features")
    st.pyplot(fig4)
else:
    st.warning("This model does not expose `feature_importances_` (e.g., LogisticRegression/MLP).")

# ────────────────────────────────────────────────────────────
# Training metrics comparison (from training phase)
# ────────────────────────────────────────────────────────────
st.subheader("⚖️ Model Accuracy Comparison (Training)")
train_metrics = load_train_metrics()
if train_metrics is not None:
    fig5, ax5 = plt.subplots(figsize=(6, 4))
    sns.barplot(data=train_metrics, x="Model", y="Accuracy", palette="crest", ax=ax5)
    ax5.set_title("CV/Test Accuracy by Model")
    ax5.set_ylim(0, 1.05)
    for i, v in enumerate(train_metrics["Accuracy"]):
        ax5.text(i, v + 0.01, f"{v:.2f}", ha="center", fontsize=9)
    st.pyplot(fig5)
    st.dataframe(train_metrics, use_container_width=True)
else:
    st.info("No training metrics CSV found yet.")

# ────────────────────────────────────────────────────────────
# Optional: try a single prediction inline (offline, NO server call)
# ────────────────────────────────────────────────────────────
st.subheader("🧪 Try a Single Prediction (Offline)")
with st.form("single_pred_form"):
    c1, c2, c3 = st.columns(3)
    pulling_severity = c1.slider("pulling_severity", 0.0, 10.0, 5.0, 1.0)
    pulling_frequency_encoded = c2.slider("pulling_frequency_encoded", 0, 5, 3, 1)
    awareness_level_encoded = c3.slider("awareness_level_encoded", 0.0, 1.0, 0.5, 0.1)
    c4, c5, c6 = st.columns(3)
    how_long_stopped_days_est = c4.number_input("how_long_stopped_days_est", min_value=0.0, value=30.0, step=1.0)
    successfully_stopped_encoded = c5.selectbox("successfully_stopped_encoded", [0, 1], index=0)
    years_since_onset = c6.number_input("years_since_onset", min_value=0.0, value=5.0, step=1.0)
    c7, c8, c9 = st.columns(3)
    age = c7.number_input("age", min_value=0.0, value=28.0, step=1.0)
    age_of_onset = c8.number_input("age_of_onset", min_value=0.0, value=22.0, step=1.0)
    emotion_intensity_sum = c9.number_input("emotion_intensity_sum", min_value=0.0, value=4.0, step=0.5)

    submitted = st.form_submit_button("Predict")
    if submitted:
        # Build a row with requested fields; any extra features missing will be zero when model was trained with ColumnSelector+scaler pipeline.
        row = {
            "pulling_severity": pulling_severity,
            "pulling_frequency_encoded": pulling_frequency_encoded,
            "awareness_level_encoded": awareness_level_encoded,
            "how_long_stopped_days_est": how_long_stopped_days_est,
            "successfully_stopped_encoded": successfully_stopped_encoded,
            "years_since_onset": years_since_onset,
            "age": age,
            "age_of_onset": age_of_onset,
            # optional extras if present in features will be picked up; otherwise ignored
            "emotion_intensity_sum": emotion_intensity_sum,
        }
        X_one = pd.DataFrame([row])
        # Align to training features (if scaler was applied during training,
        # your trained pipeline should include the exact preprocessing)
        # We assume your saved `MODEL_PATH` includes the selector in the pipeline.
        pred_num = int(model.predict(X_one)[0])
        pred_label = NUM_TO_LABEL.get(pred_num, "unknown")
        st.success(f"Prediction: **{pred_label}** (class {pred_num})")

st.caption("© 2025 TrichMind — Model audit tools")
