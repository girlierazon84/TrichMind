#!/usr/bin/env python3
"""
model_audit_dashboard.py — TrichMind Model Audit & Insights Dashboard

Visualizes:
    - Training, Validation, and Testing performance
    - Historical Accuracy/F1 trends
    - Model version performance across time
    - Model drift (training vs validation gaps)
    - Active model metadata (name, date, size)
    - Logged messages and insights
    - Optional auto-refresh
"""

import os
import joblib
import streamlit as st
import pandas as pd
import plotly.express as px
from sklearn.base import BaseEstimator
from datetime import datetime

# ──────────────────────────────
# Paths
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml"
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")

TRAIN_DIR = os.path.join(ARTIFACTS_DIR, "training_outputs")
VALID_DIR = os.path.join(ARTIFACTS_DIR, "validation_outputs")
TEST_DIR  = os.path.join(ARTIFACTS_DIR, "testing_outputs")
INFER_DIR = os.path.join(ARTIFACTS_DIR, "inference_outputs")

TRAIN_METRICS = os.path.join(TRAIN_DIR, "metrics_csv", "training_metrics.csv")
VALID_METRICS = os.path.join(VALID_DIR, "metrics_csv", "validation_metrics.csv")
TEST_METRICS  = os.path.join(TEST_DIR,  "metrics_csv", "testing_metrics.csv")

TRAIN_HISTORY = os.path.join(TRAIN_DIR, "performance_csv", "model_performance_history.csv")
VALID_HISTORY = os.path.join(VALID_DIR, "performance_csv", "validation_performance_history.csv")
TEST_HISTORY  = os.path.join(TEST_DIR,  "performance_csv", "testing_performance_history.csv")

TRAIN_LOG = os.path.join(TRAIN_DIR, "logs", "training_log.txt")
VALID_LOG = os.path.join(VALID_DIR, "logs", "validation_log.txt")
TEST_LOG  = os.path.join(TEST_DIR,  "logs", "testing_log.txt")
INFER_LOG = os.path.join(INFER_DIR, "logs", "inference_log.csv")

BEST_MODEL_PATH = os.path.join(TRAIN_DIR, "best_models", "best_relapse_risk_predictor_model.pkl")
MODEL_DIR = os.path.join(TRAIN_DIR, "best_models")

# ──────────────────────────────
# Streamlit Config
# ──────────────────────────────
st.set_page_config(page_title="TrichMind Model Audit Dashboard", page_icon="🧠", layout="wide")
st.title("🧠 TrichMind Model Audit Dashboard")
st.caption("Monitor training, validation, testing, model drift, and performance history.")
st.divider()

# ──────────────────────────────
# Sidebar Controls
# ──────────────────────────────
with st.sidebar:
    st.subheader("⏱️ Refresh Controls")
    auto = st.toggle("Enable auto-refresh", value=False)
    interval = st.selectbox("Refresh interval (seconds)", [30, 60, 120, 300], index=1, disabled=not auto)
    if st.button("🔄 Refresh now"):
        st.experimental_rerun()

if auto:
    try:
        from streamlit_autorefresh import st_autorefresh
        st_autorefresh(interval=interval * 1000, key="tm_auto_refresh")
    except Exception:
        st.markdown(f"<script>setTimeout(() => window.location.reload(), {interval * 1000});</script>", unsafe_allow_html=True)

# ──────────────────────────────
# Detect Active Model
# ──────────────────────────────
def detect_current_model():
    model_name, save_date, size_info = "Unknown Model", "N/A", "N/A"
    try:
        if os.path.exists(BEST_MODEL_PATH):
            model = joblib.load(BEST_MODEL_PATH)
            stat = os.stat(BEST_MODEL_PATH)
            save_date = datetime.fromtimestamp(stat.st_mtime).strftime("%b %d %Y, %H:%M")
            size_info = f"{stat.st_size / (1024 * 1024):.1f} MB"
            if isinstance(model, BaseEstimator):
                model_name = (
                    type(model.named_steps["clf"]).__name__
                    if hasattr(model, "named_steps")
                    else type(model).__name__
                )
            elif hasattr(model, "__class__"):
                model_name = model.__class__.__name__
    except Exception:
        pass

    if model_name == "Unknown Model" and os.path.exists(TRAIN_LOG):
        try:
            with open(TRAIN_LOG, "r", encoding="utf-8") as f:
                text = f.read()
            for kw in ["LogisticRegression", "RandomForest", "GradientBoosting", "MLPClassifier", "Keras"]:
                if kw.lower() in text.lower():
                    model_name = kw
                    break
        except Exception:
            pass
    return model_name, save_date, size_info

model_name, save_date, size_info = detect_current_model()

st.markdown(
    f"""
    <div style="background-color:#e0f4f4;padding:12px 16px;border-radius:10px;border-left:5px solid #21b2ba;">
        <h3 style="margin:0; color:#555;">🏆 Active Model: <b style="color:#0c879c;">{model_name}</b></h3>
        <p style="margin:0;font-size:15px;color:#2C2E2E;">
            Saved on <b>{save_date}</b> — Size: <b>{size_info}</b>
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)
st.divider()

# ──────────────────────────────
# Utility Loader
# ──────────────────────────────
@st.cache_data(ttl=60)
def safe_load_csv(path: str) -> pd.DataFrame:
    if os.path.exists(path):
        df = pd.read_csv(path)
        if "Date" in df.columns:
            df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
        return df
    return pd.DataFrame()

# Load metrics and histories
train_df = safe_load_csv(TRAIN_METRICS)
valid_df = safe_load_csv(VALID_METRICS)
test_df  = safe_load_csv(TEST_METRICS)
train_hist = safe_load_csv(TRAIN_HISTORY)
val_hist   = safe_load_csv(VALID_HISTORY)
test_hist  = safe_load_csv(TEST_HISTORY)

# ──────────────────────────────
# Section 1: Summary Metrics
# ──────────────────────────────
st.subheader("📊 Model Performance Overview")
cols = st.columns(3)
with cols[0]:
    st.metric("Training Accuracy", f"{train_df.get('Accuracy', pd.Series([0])).iloc[-1]:.3f}" if not train_df.empty else "—")
    st.metric("Training F1", f"{train_df.get('F1', pd.Series([0])).iloc[-1]:.3f}" if not train_df.empty else "—")
with cols[1]:
    st.metric("Validation Accuracy", f"{valid_df.get('Accuracy', pd.Series([0])).iloc[-1]:.3f}" if not valid_df.empty else "—")
    st.metric("Validation F1", f"{valid_df.get('F1', pd.Series([0])).iloc[-1]:.3f}" if not valid_df.empty else "—")
with cols[2]:
    st.metric("Testing Accuracy", f"{test_df.get('Accuracy', pd.Series([0])).iloc[-1]:.3f}" if not test_df.empty else "—")
    st.metric("Testing F1", f"{test_df.get('F1', pd.Series([0])).iloc[-1]:.3f}" if not test_df.empty else "—")
st.divider()

# ──────────────────────────────
# Section 2: Combined History
# ──────────────────────────────
st.subheader("📈 Performance Trends Across Phases")
frames = []
if not train_hist.empty: train_hist["Phase"] = "Training"; frames.append(train_hist)
if not val_hist.empty:   val_hist["Phase"]   = "Validation"; frames.append(val_hist)
if not test_hist.empty:  test_hist["Phase"]  = "Testing"; frames.append(test_hist)

if frames:
    all_hist = pd.concat(frames, ignore_index=True)
    melted = all_hist.melt(id_vars=["Date", "Phase"], value_vars=["Accuracy", "Precision", "Recall", "F1"],
                           var_name="Metric", value_name="Score")
    fig = px.line(melted, x="Date", y="Score", color="Phase", line_dash="Metric",
                  title="📊 Combined Training, Validation, and Testing Trends", markers=True,
                  color_discrete_sequence=px.colors.qualitative.Set2)
    fig.update_layout(legend_title_text="Phase / Metric", hovermode="x unified")
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("No performance history available.")
st.divider()

# ──────────────────────────────
# Section 3: Model Drift Monitor
# ──────────────────────────────
st.subheader("📉 Model Drift Monitor (Overfitting / Stability)")
if not train_hist.empty and not val_hist.empty:
    drift_df = pd.merge(train_hist, val_hist, on="Date", suffixes=("_train", "_val"))
    drift_df["Accuracy_Drift"] = drift_df["Accuracy_train"] - drift_df["Accuracy_val"]
    drift_df["F1_Drift"] = drift_df["F1_train"] - drift_df["F1_val"]

    fig_drift = px.line(
        drift_df,
        x="Date",
        y=["Accuracy_Drift", "F1_Drift"],
        title="📉 Training vs Validation Drift (Accuracy & F1 Gaps)",
        markers=True,
        labels={"value": "Drift (Train - Val)", "variable": "Metric"},
        color_discrete_sequence=["#ff7f0e", "#1f77b4"]
    )
    fig_drift.add_hline(y=0, line_dash="dot", line_color="gray")
    fig_drift.update_layout(hovermode="x unified")
    st.plotly_chart(fig_drift, use_container_width=True)

    latest_row = drift_df.iloc[-1]
    st.markdown(
        f"""
        **Latest Drift Snapshot ({latest_row['Date']:%Y-%m-%d %H:%M:%S})**
        - Accuracy Drift: `{latest_row['Accuracy_Drift']:.3f}`
        - F1 Drift: `{latest_row['F1_Drift']:.3f}`

        ⚠️ *High drift (> 0.10) may indicate overfitting or dataset drift.*
        """
    )
else:
    st.info("Drift cannot be computed — missing training or validation history.")
st.divider()

# ──────────────────────────────
# Section 4: Model Version Trend Chart
# ──────────────────────────────
st.subheader("📊 Model Version Performance Trend")
if os.path.exists(TRAIN_HISTORY):
    hist_df = pd.read_csv(TRAIN_HISTORY)
    if "Date" in hist_df.columns:
        hist_df["Date"] = pd.to_datetime(hist_df["Date"], errors="coerce")
        hist_df["Model"] = hist_df.get("Model", pd.Series(["Unnamed"] * len(hist_df)))

        melted = hist_df.melt(id_vars=["Date", "Model"], value_vars=["Accuracy", "F1"],
                              var_name="Metric", value_name="Score")

        fig_model = px.line(
            melted, x="Date", y="Score", color="Model", line_dash="Metric",
            title="📈 Accuracy & F1 Across Model Versions",
            markers=True, color_discrete_sequence=px.colors.qualitative.Pastel
        )
        fig_model.update_layout(legend_title_text="Model / Metric", hovermode="x unified")
        st.plotly_chart(fig_model, use_container_width=True)
else:
    st.info("No model version history available yet.")
st.divider()

# ──────────────────────────────
# Section 5: Logs & Insights
# ──────────────────────────────
st.subheader("🪵 Logs & Insights")
tabs = st.tabs(["Training Log", "Validation Log", "Testing Log", "Inference Log"])

def show_log(path):
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            st.text_area("Log Output", f.read(), height=300)
    else:
        st.warning(f"⚠️ Missing: {os.path.basename(path)}")

with tabs[0]:
    show_log(TRAIN_LOG)
with tabs[1]:
    show_log(VALID_LOG)
with tabs[2]:
    show_log(TEST_LOG)
with tabs[3]:
    if os.path.exists(INFER_LOG):
        df_inf = pd.read_csv(INFER_LOG)
        st.dataframe(df_inf.tail(20))
    else:
        st.info("No inference log found.")

st.success(f"🎉 Dashboard loaded — Active Model: `{model_name}` ({size_info})")
