#!/usr/bin/env python3
"""
ml/scripts/eda.py — Exploratory Data Analysis for TrichMind SQLite DB

Usage:
    python scripts/eda.py

Outputs: ml/artifacts/eda/
"""

from __future__ import annotations

import sys
import os
import sqlite3
from datetime import datetime
from pathlib import Path

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure "ml/" is on sys.path so `import common.*` works when running:
ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import EDA_DIR, DB_PATH, ensure_artifact_dirs


# Main function
def main() -> None:
    ensure_artifact_dirs()

    # Output folders
    out_png = EDA_DIR / "figures"
    out_summary = EDA_DIR / "summary"
    out_report = EDA_DIR / "report"
    log_dir = EDA_DIR / "logs"
    log_path = log_dir / "eda_log.txt"

    for d in [out_png, out_summary, out_report, log_dir]:
        d.mkdir(parents=True, exist_ok=True)

    # Reset previous logs
    if log_path.exists():
        log_path.unlink()

    def log(msg: str) -> None:
        ts = datetime.now().strftime("%H:%M:%S")
        formatted = f"[{ts}] {msg}"
        print(formatted)
        with log_path.open("a", encoding="utf-8") as f:
            f.write(formatted + "\n")

    sns.set_theme(style="whitegrid")

    log("──────────────────────────────────────────────")
    log(f"🧠 TrichMind EDA Session — {datetime.now():%Y-%m-%d %H:%M:%S}")
    log("──────────────────────────────────────────────")

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")

    def read_table(conn: sqlite3.Connection, tbl: str, tables: list[str]) -> pd.DataFrame:
        if tbl not in tables:
            log(f"⚠️ Missing table: {tbl}")
            return pd.DataFrame()
        df = pd.read_sql(f"SELECT * FROM {tbl}", conn)
        if "id" in df.columns:
            df = df.drop(columns=["id"], errors="ignore")
        log(f"✅ Loaded: {tbl} ({df.shape[0]} rows, {df.shape[1]} cols)")
        return df

    summary_data: dict[str, object] = {}

    with sqlite3.connect(DB_PATH) as conn:
        tables = pd.read_sql(
            "SELECT name FROM sqlite_master WHERE type='table';", conn
        )["name"].tolist()
        log(f"📋 Found tables: {tables}")

        demo = read_table(conn, "demographics", tables)
        beh = read_table(conn, "hair_pulling_behaviours_patterns", tables)

        # 1) Demographics
        if not demo.empty:
            try:
                fig, axs = plt.subplots(2, 3, figsize=(15, 8))
                axs = axs.flatten()
                features = [
                    ("age", "Age (Years)", "hist"),
                    ("gender", "Gender", "count"),
                    ("country", "Country", "count"),
                    ("occupation", "Occupation", "count"),
                    ("education_level", "Education Level", "count"),
                    ("family_history", "Family History", "count"),
                ]

                for i, (col, title, kind) in enumerate(features):
                    if i >= len(axs):
                        break
                    if col not in demo.columns:
                        continue
                    ax = axs[i]
                    if kind == "hist":
                        sns.histplot(demo[col], bins=20, kde=True, ax=ax)
                        summary_data["Mean Age"] = float(demo[col].mean()) if demo[col].notna().any() else "N/A"
                        summary_data["Median Age"] = float(demo[col].median()) if demo[col].notna().any() else "N/A"
                    else:
                        order = demo[col].value_counts().index
                        sns.countplot(y=demo[col], order=order, ax=ax)
                        top = demo[col].mode()
                        summary_data[f"Top {title}"] = top.iat[0] if not top.empty else "N/A"
                    ax.set_title(title)
                    ax.set_xlabel("")
                plt.tight_layout()
                plt.savefig(out_png / "demographics.png", dpi=150)
                plt.close(fig)
                log("✅ demographics.png saved.")
            except Exception as e:
                log(f"❌ Demographics plotting error: {e}")

        # 2) Behavior: frequency & awareness
        if not beh.empty:
            try:
                fig, axs = plt.subplots(1, 2, figsize=(12, 5))
                if "pulling_frequency" in beh.columns:
                    sns.countplot(x=beh["pulling_frequency"], ax=axs[0])
                    axs[0].set_title("Pulling Frequency")
                    top = beh["pulling_frequency"].mode()
                    summary_data["Top Pulling Frequency"] = top.iat[0] if not top.empty else "N/A"
                if "pulling_awareness" in beh.columns:
                    sns.countplot(x=beh["pulling_awareness"], ax=axs[1])
                    axs[1].set_title("Pulling Awareness Level")
                    top = beh["pulling_awareness"].mode()
                    summary_data["Top Awareness Level"] = top.iat[0] if not top.empty else "N/A"
                plt.tight_layout()
                plt.savefig(out_png / "behaviour_freq_awareness.png", dpi=150)
                plt.close(fig)
                log("✅ behaviour_freq_awareness.png saved.")
            except Exception as e:
                log(f"❌ Behaviour plotting error: {e}")

        # 3) Correlation heatmap (numeric)
        try:
            numeric_tables = ["demographics", "hair_pulling_behaviours_patterns"]
            numeric_frames: list[pd.DataFrame] = []
            for tbl in numeric_tables:
                df_tbl = read_table(conn, tbl, tables)
                if not df_tbl.empty:
                    numeric_frames.append(df_tbl.select_dtypes(include=["number"]))
            if numeric_frames:
                combined = pd.concat(numeric_frames, axis=1)
                if combined.shape[1] >= 2:
                    corr = combined.corr()
                    fig, ax = plt.subplots(figsize=(9, 7))
                    sns.heatmap(corr, center=0, ax=ax)
                    ax.set_title("Correlation Heatmap (Numeric Features)")
                    plt.tight_layout()
                    plt.savefig(out_png / "corr_heatmap.png", dpi=150)
                    plt.close(fig)
                    log("✅ corr_heatmap.png saved.")
        except Exception as e:
            log(f"❌ Correlation heatmap error: {e}")

        # 4) How long since last pull
        if not beh.empty and "how_long_stopped" in beh.columns:
            try:
                plt.figure(figsize=(8, 4))
                sns.histplot(beh["how_long_stopped"].dropna(), bins=20)
                plt.title("How Long Since Last Pull")
                plt.tight_layout()
                plt.savefig(out_png / "no_pull_streak_text.png", dpi=150)
                plt.close()
                log("✅ no_pull_streak_text.png saved.")
                summary_data["Entries with 'how_long_stopped'"] = int(beh["how_long_stopped"].notna().sum())
            except Exception as e:
                log(f"❌ Error plotting 'how_long_stopped': {e}")

    # 5) Save summary + report
    try:
        summary_df = pd.DataFrame(list(summary_data.items()), columns=["Metric", "Value"])
        csv_path = out_summary / "EDA_summary.csv"
        md_path = out_report / "EDA_report.md"

        summary_df.to_csv(csv_path, index=False)

        with md_path.open("w", encoding="utf-8") as md:
            md.write("# 🧠 TrichMind Exploratory Data Analysis Report\n")
            md.write(f"_Generated: {datetime.now():%Y-%m-%d %H:%M:%S}_\n\n")
            md.write("## 📊 Key Findings\n")
            for k, v in summary_data.items():
                md.write(f"- **{k}:** {v}\n")
            md.write("\n## 🖼️ Visuals\n")
            for fn in sorted(os.listdir(out_png)):
                md.write(f"- {fn}\n")
            md.write("\n## 📁 Output Folder\n")
            md.write(f"`{EDA_DIR}`\n")

        print(f"✅ EDA outputs saved under: {EDA_DIR}")
    except Exception as e:
        print(f"❌ Summary/report saving error: {e}")


if __name__ == "__main__":
    main()
