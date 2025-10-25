#!/usr/bin/env python3
"""
data_preprocessing.py — TrichMind Relapse Risk Model Feature Builder
(With Auto Scaling, Imputation Summary, Correlation Insights & JSON Metadata)

Performs:
    • Reads demographics, behaviour, and emotions tables from SQLite
    • Handles missing values (median/mode imputation)
    • Automatically selects StandardScaler or MinMaxScaler
    • Generates correlation heatmap (excludes 'id' & constant/binary columns)
    • Exports metadata (JSON) and logs preprocessing summary
    • Writes model-ready table back to the same SQLite database

Outputs (saved under ml/artifacts/preprocessed_outputs/):
    - relapse_risk_model_features (SQLite table)
    - scaler.pkl
    - imputation_summary.csv
    - correlation_heatmap.png
    - preprocessing_metadata.json
    - preprocessing_log.txt
"""

import os
import json
import logging
from logging.handlers import RotatingFileHandler
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime
from sklearn.preprocessing import StandardScaler, MinMaxScaler
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

# ──────────────────────────────
# Paths
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\artifacts"
DB_PATH = os.path.join(BASE_DIR, "database", "ttm_database.db")

PREPROCESSED_DIR = os.path.join(BASE_DIR, "preprocessed_outputs")
MODEL_DIR = os.path.join(PREPROCESSED_DIR, "scaler_model")
LOG_DIR = os.path.join(PREPROCESSED_DIR, "logs")
SUMMARY_DIR = os.path.join(PREPROCESSED_DIR, "summary")
PNG_DIR = os.path.join(PREPROCESSED_DIR, "figure-png")
META_DIR = os.path.join(PREPROCESSED_DIR, "metadata")

LOG_PATH = os.path.join(LOG_DIR, "preprocessing_log.txt")
IMPUTATION_SUMMARY_PATH = os.path.join(SUMMARY_DIR, "imputation_summary.csv")
METADATA_PATH = os.path.join(META_DIR, "preprocessing_metadata.json")
HEATMAP_PATH = os.path.join(PNG_DIR, "correlation_heatmap.png")

for d in [MODEL_DIR, LOG_DIR, SUMMARY_DIR, PNG_DIR, META_DIR]:
    os.makedirs(d, exist_ok=True)

# ──────────────────────────────
# Logging
# ──────────────────────────────
logger = logging.getLogger("trichmind.preprocessing")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
fh = RotatingFileHandler(LOG_PATH, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
fh.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S"))
if not logger.handlers:
    logger.addHandler(ch)
    logger.addHandler(fh)

# ──────────────────────────────
# Helpers
# ──────────────────────────────
def read_table(conn, table_name):
    """Read a table safely from SQLite."""
    try:
        df = pd.read_sql(f"SELECT * FROM {table_name}", conn)
        logger.info(f"📥 Loaded table '{table_name}' — {len(df)} rows, {len(df.columns)} cols")
        return df
    except Exception as e:
        logger.error(f"❌ Failed to load table '{table_name}': {e}")
        return pd.DataFrame()


def handle_missing_values(df: pd.DataFrame):
    """Fill missing values (median for numeric, mode for categorical)."""
    summary_records = []
    for col in df.columns:
        miss_count = df[col].isna().sum()
        if miss_count == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            strategy, fill_val = "median", df[col].median()
        else:
            strategy, fill_val = "mode", df[col].mode().iloc[0] if not df[col].mode().empty else "unknown"
        df[col].fillna(fill_val, inplace=True)
        summary_records.append({
            "Column": col,
            "Missing_Before": int(miss_count),
            "Imputation_Strategy": strategy,
            "Fill_Value": fill_val if not isinstance(fill_val, float) else round(fill_val, 3)
        })
        logger.info(f"🧮 {col}: filled {miss_count} NaNs ({strategy}) → {fill_val}")
    if summary_records:
        pd.DataFrame(summary_records).to_csv(IMPUTATION_SUMMARY_PATH, index=False)
        logger.info(f"📊 Imputation summary saved → {IMPUTATION_SUMMARY_PATH}")
    return df, summary_records

# ──────────────────────────────
# Feature Engineering
# ──────────────────────────────
def tag_relapse_risk(df):
    def _tag(row):
        sev, aw = row.get("pulling_severity", 0), row.get("awareness_level_encoded", 0.0)
        if pd.isna(sev) or pd.isna(aw):
            return "unknown"
        if sev >= 7 and aw <= 0.5:
            return "high"
        elif sev >= 5:
            return "moderate"
        return "low"
    df["relapse_risk_tag"] = df.apply(_tag, axis=1)
    return df


def build_features(demo, beh, emo):
    df = beh.merge(demo, on="id", how="left", suffixes=("_beh", "_demo")).merge(emo, on="id", how="left")
    df["pulling_frequency_encoded"] = df["pulling_frequency"].map(
        {"Daily": 5, "Several times a week": 4, "Weekly": 3, "Monthly": 2, "Rarely": 1}
    ).fillna(0).astype(int)
    df["awareness_level_encoded"] = df["pulling_awareness"].map(
        {"Yes": 1.0, "Sometimes": 0.5, "No": 0.0}
    ).fillna(0.0)
    df["successfully_stopped_encoded"] = df["successfully_stopped"].map({"Yes": 1, "No": 0}).fillna(0)
    if "how_long_stopped" in df.columns:
        df["how_long_stopped_days_est"] = (
            df["how_long_stopped"].astype(str).str.extract(r"(\d+)")[0].astype(float).fillna(0)
        )
    if {"age", "age_of_onset"}.issubset(df.columns):
        df["years_since_onset"] = df["age"] - df["age_of_onset"]
    emo_cols = [c for c in emo.columns if c != "id"]
    if emo_cols:
        df["emotion_intensity_sum"] = df[emo_cols].select_dtypes(include=["number"]).sum(axis=1)
    df = tag_relapse_risk(df)
    drop_cols = ["pulling_frequency", "pulling_awareness", "how_long_stopped", "successfully_stopped"]
    df.drop(columns=[c for c in drop_cols if c in df.columns], inplace=True, errors="ignore")
    return df

# ──────────────────────────────
# Scaling & Correlation
# ──────────────────────────────
def auto_choose_scaler(df):
    num_cols = df.select_dtypes(include=["number"]).columns
    if not len(num_cols):
        return "standard", 0.0
    outlier_score = 0
    for col in num_cols:
        q1, q3 = np.percentile(df[col].dropna(), [25, 75])
        iqr = q3 - q1
        upper, lower = q3 + 1.5 * iqr, q1 - 1.5 * iqr
        outlier_score += ((df[col] < lower) | (df[col] > upper)).mean()
    ratio = outlier_score / len(num_cols)
    scaler = "minmax" if ratio > 0.1 else "standard"
    logger.info(f"🔍 Outlier ratio ≈ {ratio:.2%} → Using {scaler.title()}Scaler")
    return scaler, ratio


def scale_features(df, scaler_type):
    num_cols = df.select_dtypes(include=["number"]).columns
    scaler = StandardScaler() if scaler_type == "standard" else MinMaxScaler()
    df[num_cols] = scaler.fit_transform(df[num_cols])
    scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_path)
    logger.info(f"⚖️ {scaler_type.title()}Scaler fitted & saved → {scaler_path}")
    return df


def generate_correlation_heatmap(df):
    """Generate and save correlation heatmap excluding 'id', constant & binary columns."""
    num_df = df.select_dtypes(include=["number"]).copy()

    # Exclude ID & constant/binary columns
    drop_cols = []
    for col in num_df.columns:
        if col.lower() == "id" or num_df[col].nunique() <= 2:
            drop_cols.append(col)
    num_df.drop(columns=drop_cols, inplace=True, errors="ignore")

    if num_df.empty:
        logger.warning("⚠️ No numeric columns left for correlation heatmap.")
        return pd.DataFrame()

    corr = num_df.corr()
    plt.figure(figsize=(10, 8))
    sns.heatmap(corr, cmap="coolwarm", center=0)
    plt.title("Feature Correlation Heatmap (Excluding ID & Binary Columns)")
    plt.tight_layout()
    plt.savefig(HEATMAP_PATH, dpi=200)
    plt.close()
    logger.info(f"🖼️ Correlation heatmap saved → {HEATMAP_PATH}")
    return corr

# ──────────────────────────────
# Metadata Export
# ──────────────────────────────
def export_metadata(df, scaler_type, outlier_ratio, imputation_records, corr):
    meta = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rows": len(df),
        "columns": list(df.columns),
        "scaler_type": scaler_type,
        "outlier_ratio": round(outlier_ratio, 4),
        "imputed_columns": [r["Column"] for r in imputation_records],
        "database_table": "relapse_risk_model_features",
        "scaler_path": os.path.join(MODEL_DIR, "scaler.pkl"),
        "heatmap_path": HEATMAP_PATH
    }
    if not corr.empty:
        top = corr.abs().unstack().sort_values(ascending=False).drop_duplicates()
        meta["top_correlations"] = [
            {"feature_a": a, "feature_b": b, "correlation": round(float(val), 3)}
            for (a, b), val in top[top < 1].head(5).items()
        ]
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=4)
    logger.info(f"📁 Metadata exported → {METADATA_PATH}")

# ──────────────────────────────
# Main
# ──────────────────────────────
def main():
    start = datetime.now()
    logger.info("──────────────────────────────────────────────")
    logger.info(f"🧩 TrichMind Preprocessing — {start:%Y-%m-%d %H:%M:%S}")
    logger.info("──────────────────────────────────────────────")

    conn = sqlite3.connect(DB_PATH)
    demo = read_table(conn, "demographics")
    beh = read_table(conn, "hair_pulling_behaviours_patterns")
    emo = read_table(conn, "emotions_before_pulling")

    if demo.empty or beh.empty or emo.empty:
        logger.error("❌ Missing required tables in the database.")
        return

    df = build_features(demo, beh, emo)
    df, imputation_records = handle_missing_values(df)
    scaler_type, outlier_ratio = auto_choose_scaler(df)
    df_scaled = scale_features(df, scaler_type)

    df_scaled.to_sql("relapse_risk_model_features", conn, if_exists="replace", index=False)
    conn.close()
    logger.info(f"✅ Saved 'relapse_risk_model_features' to SQLite → {DB_PATH}")

    corr = generate_correlation_heatmap(df_scaled)
    export_metadata(df_scaled, scaler_type, outlier_ratio, imputation_records, corr)

    runtime = (datetime.now() - start).total_seconds()
    logger.info(f"⏱️ Runtime: {runtime:.2f} sec — Preprocessing complete.")
    logger.info("──────────────────────────────────────────────")


if __name__ == "__main__":
    main()
