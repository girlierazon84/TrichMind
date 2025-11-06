#!/usr/bin/env python3
from __future__ import annotations
import json
import logging
from logging.handlers import RotatingFileHandler
import sqlite3
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import StandardScaler

from common.config import (
DB_PATH, SCALER_PATH, FEATURES_JSON, PREPROC_META_JSON,
IMPUTE_CSV, HEATMAP_PNG, PREPROC_LOG_DIR, PREPROC_FIG_DIR,
)


# Setting up logging
LOG_PATH = Path(PREPROC_LOG_DIR) / "preprocessing_log.txt"

# Configure logger
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

# Function to read a table from the SQLite database
def read_table(conn: sqlite3.Connection, table: str) -> pd.DataFrame:
    try:
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        logger.info(f"Loaded '{table}' → {df.shape}")
        return df
    except Exception as e:
        logger.error(f"Missing table '{table}': {e}")
        return pd.DataFrame()

# Function to build features by merging demographic, behavioral, and emotional data
def build_features(demo: pd.DataFrame, beh: pd.DataFrame, emo: pd.DataFrame) -> pd.DataFrame:
    df = (
        beh.merge(demo, on="id", how="left", suffixes=("_beh", "_demo"))
            .merge(emo, on="id", how="left")
    )

    # Encodings - pulling_frequency
    df["pulling_frequency_encoded"] = (
        df.get("pulling_frequency", pd.Series(dtype="object")).map({
            "Daily": 5, "Several times a week": 4, "Weekly": 3, "Monthly": 2, "Rarely": 1
        }).fillna(0).astype(int)
    )
    # Encodings - pulling_awareness
    df["awareness_level_encoded"] = (
        df.get("pulling_awareness", pd.Series(dtype="object")).map({
            "Yes": 1.0, "Sometimes": 0.5, "No": 0.0
        }).fillna(0.0).astype(float)
    )
    # Encodings - successfully_stopped
    df["successfully_stopped_encoded"] = (
        df.get("successfully_stopped", pd.Series(dtype="object")).map({"Yes": 1, "No": 0}).fillna(0).astype(int)
    )

    # How long stopped (estimate in days)
    if "how_long_stopped" in df.columns:
        df["how_long_stopped_days_est"] = (
            df["how_long_stopped"].astype(str).str.extract(r"(\d+)")[0].astype(float).fillna(0.0)
        )
    else:
        df["how_long_stopped_days_est"] = 0.0

    # Years since onset
    if {"age", "age_of_onset"}.issubset(df.columns):
        df["years_since_onset"] = df["age"].astype(float) - df["age_of_onset"].astype(float)
    else:
        df["years_since_onset"] = 0.0

    # Emotion intensity sum
    emo_cols = [c for c in emo.columns if c != "id"]
    if emo_cols:
        df["emotion_intensity_sum"] = df[emo_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)
    else:
        df["emotion_intensity_sum"] = 0.0

    # Clean raw text columns not needed downstream
    df.drop(columns=[c for c in ["pulling_frequency", "pulling_awareness", "how_long_stopped", "successfully_stopped"] if c in df.columns], inplace=True, errors="ignore")

    # Ensure 'id' column exists
    if "id" not in df.columns:
        df["id"] = np.arange(1, len(df) + 1)
    return df

# Function to handle missing values in the DataFrame
def handle_missing(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    recs: list[dict] = []
    for c in df.columns:
        before = int(df[c].isna().sum())
        if before == 0:
            continue
        if pd.api.types.is_numeric_dtype(df[c]):
            strategy, val = "median", df[c].median()
        else:
            m = df[c].mode()
            strategy, val = "mode", (m.iloc[0] if not m.empty else "unknown")
        df[c] = df[c].fillna(val)
        recs.append({"Column": c, "Missing_Before": before, "Missing_After": int(df[c].isna().sum()), "Imputation_Strategy": strategy, "Fill_Value": float(val) if isinstance(val, (float, int)) else val})
    (pd.DataFrame(recs) if recs else pd.DataFrame([{"Column":"None","Missing_Before":0,"Missing_After":0,"Imputation_Strategy":"N/A","Fill_Value":"None"}])).to_csv(IMPUTE_CSV, index=False)
    logger.info(f"Imputation summary → {IMPUTE_CSV}")
    return df, recs

# Function to fit and save a StandardScaler for numeric features
def fit_scale_numeric(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    if "relapse_risk_tag" in num_cols:
        num_cols.remove("relapse_risk_tag")
    scaler = StandardScaler()
    df[num_cols] = scaler.fit_transform(df[num_cols])
    joblib.dump(scaler, SCALER_PATH)
    json.dump(num_cols, open(FEATURES_JSON, "w", encoding="utf-8"), indent=2)
    logger.info(f"Saved scaler → {SCALER_PATH}; features.json → {FEATURES_JSON}")
    return df, num_cols

# Function to generate and save a correlation heatmap of numeric features
def corr_heatmap(df: pd.DataFrame) -> None:
    num = df.select_dtypes(include=["number"]).copy()
    drop = [c for c in num.columns if c.lower() == "id" or num[c].nunique() <= 2]
    num.drop(columns=drop, inplace=True, errors="ignore")
    if num.shape[1] < 3:
        logger.warning("Not enough numeric cols for correlation heatmap")
        return
    corr = num.corr()
    PREPROC_FIG_DIR.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(10,8))
    sns.heatmap(corr, cmap="coolwarm", center=0)
    plt.title("Feature Correlation Heatmap")
    plt.tight_layout()
    plt.savefig(HEATMAP_PNG, dpi=160)
    plt.close()
    logger.info(f"Heatmap → {HEATMAP_PNG}")

# Function to export preprocessing metadata to a JSON file
def export_meta(df: pd.DataFrame, imputed: list[dict], features: list[str]) -> None:
    meta = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rows": int(len(df)),
        "columns": list(df.columns),
        "database_table": "relapse_risk_model_features",
        "scaler": str(SCALER_PATH),
        "features_json": str(FEATURES_JSON),
        "n_numeric_features": len(features),
        "imputed_columns": [r["Column"] for r in (imputed or [])],
        "heatmap_path": str(HEATMAP_PNG),
    }
    json.dump(meta, open(PREPROC_META_JSON, "w", encoding="utf-8"), indent=2)
    logger.info(f"Metadata → {PREPROC_META_JSON}")

# Main preprocessing function
def main() -> None:
    logger.info("──── TrichMind Preprocessing start ────")
    conn = sqlite3.connect(DB_PATH)
    demo = read_table(conn, "demographics")
    beh = read_table(conn, "hair_pulling_behaviours_patterns")
    emo = read_table(conn, "emotions_before_pulling")
    if demo.empty or beh.empty or emo.empty:
        raise SystemExit("❌ Required tables are missing")

    # Build features
    df = build_features(demo, beh, emo)
    # Handle missing values
    df, imp = handle_missing(df)
    # Scale numeric features
    df_scaled, features = fit_scale_numeric(df)

    # Persist to SQLite
    df_scaled.to_sql("relapse_risk_model_features", conn, if_exists="replace", index=False)
    conn.close()
    logger.info("Saved table 'relapse_risk_model_features' to DB")

    # Generate correlation heatmap and export metadata
    corr_heatmap(df_scaled)
    export_meta(df_scaled, imp, features)
    logger.info("──── Preprocessing complete ────")

if __name__ == "__main__":
    main()