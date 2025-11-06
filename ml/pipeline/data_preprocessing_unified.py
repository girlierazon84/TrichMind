#!/usr/bin/env python3
"""
data_preprocessing_unified.py — TrichMind Comprehensive Preprocessing Pipeline

Builds a unified dataset merging demographics, behaviors, emotions, coping strategies,
activities, environment, triggers, and comorbidities for relapse-risk modeling.

Outputs:
    • SQLite table: relapse_risk_model_features
    • Scaler (scaler.pkl)
    • Feature list (features.json)
    • Imputation summary (imputation_summary.csv)
    • Metadata (preprocessing_meta.json)
    • Correlation heatmap (preprocessing_heatmap.png)
"""

from __future__ import annotations
import json
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from pathlib import Path
import sqlite3
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler

# Import shared config paths
from common.config import (
    DB_PATH, SCALER_PATH, FEATURES_JSON, PREPROC_META_JSON,
    IMPUTE_CSV, HEATMAP_PNG, PREPROC_LOG_DIR, PREPROC_FIG_DIR
)

# ──────────────────────────────
# Logging setup
# ──────────────────────────────
LOG_PATH = Path(PREPROC_LOG_DIR) / "preprocessing_log.txt"
logger = logging.getLogger("trichmind.preprocessing")
logger.setLevel(logging.INFO)

if not logger.handlers:
    PREPROC_LOG_DIR.mkdir(parents=True, exist_ok=True)
    fh = RotatingFileHandler(LOG_PATH, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S"))
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))
    logger.addHandler(fh)
    logger.addHandler(ch)


# ──────────────────────────────
# Database read helper
# ──────────────────────────────
def read_table(conn, table):
    """Safely read a SQLite table into a DataFrame."""
    try:
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        logger.info(f"Loaded '{table}' → shape={df.shape}")
        return df
    except Exception as e:
        logger.error(f"Failed to read '{table}': {e}")
        return pd.DataFrame()


# ──────────────────────────────
# Feature merging & encoding
# ──────────────────────────────
def build_features(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """Merge all tables on 'id' and engineer features."""
    df = tables["hair_pulling_behaviours_patterns"]
    for name, tdf in tables.items():
        if name != "hair_pulling_behaviours_patterns":
            df = df.merge(tdf, on="id", how="left")

    # Ordinal encodings
    df["pulling_frequency_encoded"] = df["pulling_frequency"].map({
        "Daily": 5, "Several times a week": 4, "Weekly": 3, "Monthly": 2, "Rarely": 1
    }).fillna(0).astype(int)

    df["awareness_level_encoded"] = df["pulling_awareness"].map({
        "Yes": 1.0, "Sometimes": 0.5, "No": 0.0
    }).fillna(0.0).astype(float)

    df["successfully_stopped_encoded"] = df["successfully_stopped"].map({
        "Yes": 1, "No": 0
    }).fillna(0).astype(int)

    # Derived metrics
    if {"age", "age_of_onset"}.issubset(df.columns):
        df["years_since_onset"] = df["age"].astype(float) - df["age_of_onset"].astype(float)
    else:
        df["years_since_onset"] = 0.0

    if "how_long_stopped" in df.columns:
        df["how_long_stopped_days_est"] = (
            df["how_long_stopped"].astype(str).str.extract(r"(\d+)")[0].astype(float).fillna(0.0)
        )
    else:
        df["how_long_stopped_days_est"] = 0.0

    # Emotional & coping sums
    emo_cols = [c for c in df.columns if any(k in c for k in ["stress", "anxious", "bored", "sad", "lonely", "regret", "guilt"])]
    df["emotion_intensity_sum"] = df[emo_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)

    coping_cols = [c for c in df.columns if "therapy" in c or "coping" in c or "journaling" in c]
    df["coping_activity_sum"] = df[coping_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)

    trigger_cols = [c for c in df.columns if "trigger" in c or "impulse" in c or "stressful" in c]
    df["trigger_count"] = df[trigger_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)

    # One-hot encode categorical demographics
    cat_cols = ["gender", "education_level", "occupation", "country"]
    for col in cat_cols:
        if col in df.columns:
            dummies = pd.get_dummies(df[col].astype(str), prefix=col)
            df = pd.concat([df.drop(columns=[col]), dummies], axis=1)

    # Drop redundant raw columns
    df.drop(columns=[
        "pulling_frequency", "pulling_awareness", "how_long_stopped",
        "successfully_stopped"
    ], errors="ignore", inplace=True)

    return df


# ──────────────────────────────
# Missing values
# ──────────────────────────────
def handle_missing(df):
    """Impute missing values and record the operations."""
    records = []
    for c in df.columns:
        missing_before = int(df[c].isna().sum())
        if missing_before == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            strategy, value = "median", df[c].median()
        else:
            mode = df[c].mode()
            strategy, value = "mode", (mode.iloc[0] if not mode.empty else "unknown")
        df[c] = df[c].fillna(value)
        records.append({
            "Column": c, "Missing_Before": missing_before,
            "Missing_After": int(df[c].isna().sum()),
            "Imputation_Strategy": strategy, "Fill_Value": value
        })

    # Always write file, even if empty (for transparency)
    impute_df = pd.DataFrame(records)
    if impute_df.empty:
        impute_df = pd.DataFrame([{
            "Column": "— No Missing Values —",
            "Missing_Before": 0,
            "Missing_After": 0,
            "Imputation_Strategy": "none",
            "Fill_Value": "none"
        }])
    impute_df.to_csv(IMPUTE_CSV, index=False)
    logger.info(f"Imputation summary saved → {IMPUTE_CSV}")
    return df, records


# ──────────────────────────────
# Scaling & export
# ──────────────────────────────
def scale_and_save(df):
    """Standardize numeric columns and save feature metadata."""
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if "id" in num_cols:
        num_cols.remove("id")  # exclude id from scaling
    scaler = StandardScaler()
    df[num_cols] = scaler.fit_transform(df[num_cols])
    joblib.dump(scaler, SCALER_PATH)
    json.dump(num_cols, open(FEATURES_JSON, "w", encoding="utf-8"), indent=2)
    logger.info(f"Scaler saved → {SCALER_PATH}; Features list → {FEATURES_JSON}")
    return df, num_cols


# ──────────────────────────────
# Visualization & metadata
# ──────────────────────────────
def corr_heatmap(df):
    """Generate correlation heatmap (excluding ID & binary-only features)."""
    num_df = df.select_dtypes(include=["number"]).copy()
    drop = [c for c in num_df.columns if num_df[c].nunique() <= 2 or c.lower() == "id"]
    num_df.drop(columns=drop, inplace=True, errors="ignore")

    if num_df.shape[1] < 3:
        logger.warning("Not enough numeric features for correlation heatmap.")
        return

    corr = num_df.corr()
    PREPROC_FIG_DIR.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(12, 9))
    sns.heatmap(corr, cmap="coolwarm", center=0)
    plt.title("TrichMind Unified Feature Correlation")
    plt.tight_layout()
    plt.savefig(HEATMAP_PNG, dpi=160)
    plt.close()
    logger.info(f"Correlation heatmap saved → {HEATMAP_PNG}")


def export_meta(df, imputed, features):
    """Export metadata summary for reproducibility."""
    meta = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rows": len(df),
        "columns": list(df.columns),
        "n_features": len(features),
        "imputed_columns": [r["Column"] for r in imputed],
        "database_table": "relapse_risk_model_features",
        "heatmap_path": str(HEATMAP_PNG),
    }
    json.dump(meta, open(PREPROC_META_JSON, "w", encoding="utf-8"), indent=2)
    logger.info(f"Metadata saved → {PREPROC_META_JSON}")


# ──────────────────────────────
# Main
# ──────────────────────────────
def main():
    logger.info("──── TrichMind Unified Preprocessing start ────")
    conn = sqlite3.connect(DB_PATH)

    # Load all tables
    tables = {
        name: read_table(conn, name)
        for name in [
            "demographics", "hair_pulling_behaviours_patterns", "emotions_before_pulling",
            "emotions_after_pulling", "activities", "coping_strategies_tried",
            "effective_coping_strategies", "pulling_environment", "pulling_triggers",
            "seasons_affect_pulling_intensity", "other_mental_health_conditions",
            "parts_of_the_body_pulled"
        ]
    }

    # Build, clean, and scale features
    df = build_features(tables)
    df, imp = handle_missing(df)
    df_scaled, features = scale_and_save(df)

    # Save to database
    df_scaled.to_sql("relapse_risk_model_features", conn, if_exists="replace", index=False)
    conn.close()
    logger.info("Saved table → relapse_risk_model_features")

    # Visualization & metadata export
    corr_heatmap(df_scaled)
    export_meta(df_scaled, imp, features)
    logger.info("──── Preprocessing complete ────")


if __name__ == "__main__":
    main()
