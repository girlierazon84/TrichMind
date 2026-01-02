#!/usr/bin/env python3
"""
ml/scripts/data_preprocessing.py — TrichMind Unified Preprocessing Pipeline

Usage:
    python scripts/data_preprocessing.py

Outputs:
    - SQLite table: relapse_risk_model_features
    - scaler.pkl
    - features.json
    - imputation_summary.csv
    - preprocessing_metadata.json
    - correlation_heatmap.png
    - preprocessing_log.txt
"""

from __future__ import annotations

import sys
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

# Ensure "ml/" is on sys.path so `import common.*` works when running:
ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import (
    DB_PATH,
    SCALER_PATH,
    FEATURES_JSON,
    PREPROC_META_JSON,
    IMPUTE_CSV,
    HEATMAP_PNG,
    PREPROC_LOG_DIR,
    PREPROC_FIG_DIR,
    PREPROC_META_DIR,
    PREPROC_SUMMARY_DIR,
    ensure_artifact_dirs,
)


# ──────────────────────────────
# Logger setup
# ──────────────────────────────
def setup_logger() -> logging.Logger:
    ensure_artifact_dirs()
    PREPROC_LOG_DIR.mkdir(parents=True, exist_ok=True)

    log_path = Path(PREPROC_LOG_DIR) / "preprocessing_log.txt"
    logger = logging.getLogger("trichmind.preprocessing")
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers on re-run
    if logger.handlers:
        return logger

    fh = RotatingFileHandler(log_path, maxBytes=5_000_000, backupCount=3, encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s", "%Y-%m-%d %H:%M:%S"))

    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("[%(levelname)s] %(message)s"))

    logger.addHandler(fh)
    logger.addHandler(ch)
    return logger


logger = setup_logger()


# ──────────────────────────────
# Helpers
# ──────────────────────────────
def read_table(conn: sqlite3.Connection, table: str) -> pd.DataFrame:
    try:
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        logger.info(f"Loaded '{table}' → shape={df.shape}")
        return df
    except Exception as e:
        logger.error(f"Failed to read '{table}': {e}")
        return pd.DataFrame()


def _series(df: pd.DataFrame, col: str, default: object = "") -> pd.Series:
    """Safe column getter returning a Series aligned to df length."""
    if col in df.columns:
        return df[col]
    return pd.Series([default] * len(df), index=df.index)


# ──────────────────────────────
# Build features
# ──────────────────────────────
def build_features(tables: dict[str, pd.DataFrame]) -> pd.DataFrame:
    base = "hair_pulling_behaviours_patterns"
    df = tables[base].copy()

    # Merge other tables on id when possible
    for name, tdf in tables.items():
        if name == base:
            continue
        if not tdf.empty and "id" in tdf.columns and "id" in df.columns:
            df = df.merge(tdf, on="id", how="left")

    # --- Encodings from behavior table ---
    pf = _series(df, "pulling_frequency", "")
    df["pulling_frequency_encoded"] = pf.map({
        "Daily": 5,
        "Several times a week": 4,
        "Weekly": 3,
        "Monthly": 2,
        "Rarely": 1,
    }).fillna(0).astype(int)

    pa = _series(df, "pulling_awareness", "")
    df["awareness_level_encoded"] = pa.map({
        "Yes": 1.0,
        "Sometimes": 0.5,
        "No": 0.0,
    }).fillna(0.0).astype(float)

    ss = _series(df, "successfully_stopped", "")
    df["successfully_stopped_encoded"] = ss.map({
        "Yes": 1,
        "No": 0,
    }).fillna(0).astype(int)

    # --- Preserve RAW values for label building later (DO NOT SCALE) ---
    if "pulling_severity" in df.columns:
        df["pulling_severity_raw"] = pd.to_numeric(df["pulling_severity"], errors="coerce")
    else:
        df["pulling_severity_raw"] = np.nan

    df["awareness_level_encoded_raw"] = pd.to_numeric(df["awareness_level_encoded"], errors="coerce")

    # Derived metrics
    if {"age", "age_of_onset"}.issubset(df.columns):
        df["years_since_onset"] = pd.to_numeric(df["age"], errors="coerce") - pd.to_numeric(df["age_of_onset"], errors="coerce")
    else:
        df["years_since_onset"] = 0.0

    if "how_long_stopped" in df.columns:
        df["how_long_stopped_days_est"] = (
            df["how_long_stopped"]
            .astype(str)
            .str.extract(r"(\d+)")[0]
            .astype(float)
            .fillna(0.0)
        )
    else:
        df["how_long_stopped_days_est"] = 0.0

    # Sums (numeric-only)
    emo_cols = [c for c in df.columns if any(k in c.lower() for k in ["stress", "anxious", "bored", "sad", "lonely", "regret", "guilt"])]
    df["emotion_intensity_sum"] = (
        df[emo_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)
        if emo_cols else 0.0
    )

    coping_cols = [c for c in df.columns if any(k in c.lower() for k in ["therapy", "coping", "journaling"])]
    df["coping_activity_sum"] = (
        df[coping_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)
        if coping_cols else 0.0
    )

    trigger_cols = [c for c in df.columns if any(k in c.lower() for k in ["trigger", "impulse", "stressful"])]
    df["trigger_count"] = (
        df[trigger_cols].select_dtypes(include=["number"]).sum(axis=1).fillna(0.0)
        if trigger_cols else 0.0
    )

    # One-hot encode demographics
    cat_cols = ["gender", "education_level", "occupation", "country"]
    for col in cat_cols:
        if col in df.columns:
            dummies = pd.get_dummies(df[col].astype(str), prefix=col)
            df = pd.concat([df.drop(columns=[col]), dummies], axis=1)

    # Drop redundant raw text columns
    df.drop(
        columns=["pulling_frequency", "pulling_awareness", "how_long_stopped", "successfully_stopped"],
        errors="ignore",
        inplace=True,
    )

    return df


# ──────────────────────────────
# Missing values
# ──────────────────────────────
def handle_missing(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    records: list[dict] = []
    for c in df.columns:
        missing_before = int(df[c].isna().sum())
        if missing_before == 0:
            continue

        if pd.api.types.is_numeric_dtype(df[c]):
            strategy, value = "median", float(df[c].median()) if not np.isnan(df[c].median()) else 0.0
        else:
            mode = df[c].mode()
            strategy, value = "mode", (mode.iloc[0] if not mode.empty else "unknown")

        df[c] = df[c].fillna(value)
        records.append({
            "Column": c,
            "Missing_Before": missing_before,
            "Missing_After": int(df[c].isna().sum()),
            "Imputation_Strategy": strategy,
            "Fill_Value": value,
        })

    PREPROC_SUMMARY_DIR.mkdir(parents=True, exist_ok=True)
    IMPUTE_CSV.parent.mkdir(parents=True, exist_ok=True)

    impute_df = pd.DataFrame(records)
    if impute_df.empty:
        impute_df = pd.DataFrame([{
            "Column": "— No Missing Values —",
            "Missing_Before": 0,
            "Missing_After": 0,
            "Imputation_Strategy": "none",
            "Fill_Value": "none",
        }])

    impute_df.to_csv(IMPUTE_CSV, index=False)
    logger.info(f"Imputation summary saved → {IMPUTE_CSV}")
    return df, records


# ──────────────────────────────
# Scaling & features.json
# ──────────────────────────────
def scale_and_save(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """
    Scale numeric model features but DO NOT scale:
      - id
      - *_raw columns used for labeling
    features.json will contain the numeric feature columns used for training.
    """
    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
    num_cols = [c for c in num_cols if c != "id" and not c.endswith("_raw")]

    scaler = StandardScaler()
    if num_cols:
        df[num_cols] = scaler.fit_transform(df[num_cols])

    SCALER_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(scaler, SCALER_PATH)

    FEATURES_JSON.parent.mkdir(parents=True, exist_ok=True)
    with FEATURES_JSON.open("w", encoding="utf-8") as f:
        json.dump(num_cols, f, indent=2)

    logger.info(f"Scaler saved → {SCALER_PATH}")
    logger.info(f"Features list saved → {FEATURES_JSON} (n={len(num_cols)})")
    return df, num_cols


# ──────────────────────────────
# Correlation heatmap
# ──────────────────────────────
def corr_heatmap(df: pd.DataFrame) -> None:
    num_df = df.select_dtypes(include=["number"]).copy()

    # drop low-variance + id + raw helper cols
    drop = [c for c in num_df.columns if num_df[c].nunique() <= 2 or c.lower() == "id" or c.endswith("_raw")]
    num_df.drop(columns=drop, inplace=True, errors="ignore")

    if num_df.shape[1] < 3:
        logger.warning("Not enough numeric features for correlation heatmap.")
        return

    corr = num_df.corr()
    PREPROC_FIG_DIR.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(12, 9))
    sns.heatmap(corr, center=0)
    plt.title("TrichMind Unified Feature Correlation")
    plt.tight_layout()
    plt.savefig(HEATMAP_PNG, dpi=160)
    plt.close()

    logger.info(f"Correlation heatmap saved → {HEATMAP_PNG}")


# ──────────────────────────────
# Metadata export
# ──────────────────────────────
def export_meta(df: pd.DataFrame, imputed: list[dict], features: list[str]) -> None:
    PREPROC_META_DIR.mkdir(parents=True, exist_ok=True)
    PREPROC_META_JSON.parent.mkdir(parents=True, exist_ok=True)

    meta = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "rows": int(len(df)),
        "columns": list(df.columns),
        "n_features": int(len(features)),
        "feature_columns": features,
        "imputed_columns": [r["Column"] for r in imputed],
        "database_table": "relapse_risk_model_features",
        "heatmap_path": str(HEATMAP_PNG),
    }
    with PREPROC_META_JSON.open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    logger.info(f"Metadata saved → {PREPROC_META_JSON}")


# ──────────────────────────────
# Main
# ──────────────────────────────
def main() -> None:
    logger.info("──── TrichMind Unified Preprocessing start ────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")

    table_names = [
        "demographics",
        "hair_pulling_behaviours_patterns",
        "emotions_before_pulling",
        "emotions_after_pulling",
        "activities",
        "coping_strategies_tried",
        "effective_coping_strategies",
        "pulling_environment",
        "pulling_triggers",
        "seasons_affect_pulling_intensity",
        "other_mental_health_conditions",
        "parts_of_the_body_pulled",
    ]

    with sqlite3.connect(DB_PATH) as conn:
        tables = {name: read_table(conn, name) for name in table_names}

        if tables["hair_pulling_behaviours_patterns"].empty:
            raise RuntimeError("❌ Required base table 'hair_pulling_behaviours_patterns' is empty or missing.")

        df = build_features(tables)
        df, imp = handle_missing(df)
        df_scaled, features = scale_and_save(df)

        df_scaled.to_sql("relapse_risk_model_features", conn, if_exists="replace", index=False)

    logger.info("Saved table → relapse_risk_model_features")
    corr_heatmap(df_scaled)
    export_meta(df_scaled, imp, features)
    logger.info("──── Preprocessing complete ────")


if __name__ == "__main__":
    main()
