#!/usr/bin/env python3
"""
eda.py — Exploratory Data Analysis for TrichMind TTM Database

Performs visual and statistical EDA on the TrichMind SQLite database.

Generates:
    - demographics.png
    - behaviour_freq_awareness.png
    - corr_heatmap.png
    - no_pull_streak_text.png
    - EDA_summary.csv
    - EDA_report.md
    - eda_log.txt

Outputs: /ml/artifacts/eda/
"""

import os
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# ──────────────────────────────
# Directories
# ──────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(BASE_DIR, "artifacts")
DB_PATH = os.path.join(ARTIFACTS_DIR, "database", "ttm_database.db")

EDA_DIR = os.path.join(ARTIFACTS_DIR, "eda")
OUT_PNG = os.path.join(EDA_DIR, "figures")
OUT_SUMMARY = os.path.join(EDA_DIR, "summary")
OUT_REPORT = os.path.join(EDA_DIR, "report")
LOG_PATH = os.path.join(EDA_DIR, "eda_log.txt")

for d in [EDA_DIR, OUT_PNG, OUT_SUMMARY, OUT_REPORT]:
    os.makedirs(d, exist_ok=True)

sns.set_theme(style="whitegrid", palette="crest")

# ──────────────────────────────
# Logging Helper
# ──────────────────────────────
def log(msg: str):
    """Prints and writes a timestamped log entry."""
    ts = datetime.now().strftime("%H:%M:%S")
    formatted = f"[{ts}] {msg}"
    print(formatted)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

# Reset previous logs
if os.path.exists(LOG_PATH):
    os.remove(LOG_PATH)

log("──────────────────────────────────────────────")
log(f"🧠 TrichMind EDA Session — {datetime.now():%Y-%m-%d %H:%M:%S}")
log("──────────────────────────────────────────────")

# ──────────────────────────────
# Database Connection
# ──────────────────────────────
if not os.path.exists(DB_PATH):
    raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")

with sqlite3.connect(DB_PATH) as conn:
    tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)["name"].tolist()
    log(f"📋 Found tables: {tables}")

    def safe_read(tbl: str) -> pd.DataFrame:
        """Safely read a SQLite table."""
        if tbl in tables:
            df = pd.read_sql(f"SELECT * FROM {tbl}", conn)
            if "id" in df.columns:
                df.drop(columns=["id"], inplace=True)
            log(f"✅ Loaded: {tbl} ({df.shape[0]} rows)")
            return df
        log(f"⚠️ Skipping missing table: {tbl}")
        return pd.DataFrame()

    demo = safe_read("demographics")
    beh = safe_read("hair_pulling_behaviours_patterns")

summary_data = {}

# ──────────────────────────────
# 1️⃣ Demographics Overview
# ──────────────────────────────
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
            if col in demo.columns:
                ax = axs[i]
                if kind == "hist":
                    sns.histplot(demo[col], bins=20, kde=True, ax=ax, color="#5DA5DA")
                    summary_data["Mean Age"] = demo[col].mean().round(2)
                    summary_data["Median Age"] = demo[col].median().round(2)
                else:
                    sns.countplot(y=demo[col], order=demo[col].value_counts().index,
                                    ax=ax, palette="crest", legend=False)
                    summary_data[f"Top {title}"] = demo[col].mode().iat[0] if not demo[col].mode().empty else "N/A"
                ax.set_title(title)
                ax.set_xlabel("")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "demographics.png"), dpi=150)
        plt.close(fig)
        log("✅ demographics.png saved.")
    except Exception as e:
        log(f"❌ Demographics plotting error: {e}")

# ──────────────────────────────
# 2️⃣ Behavior: Frequency & Awareness
# ──────────────────────────────
if not beh.empty:
    try:
        fig, axs = plt.subplots(1, 2, figsize=(12, 5))
        if "pulling_frequency" in beh.columns:
            sns.countplot(x=beh["pulling_frequency"], ax=axs[0], palette="ch:start=.2,rot=-.3")
            axs[0].set_title("Pulling Frequency")
            summary_data["Top Pulling Frequency"] = beh["pulling_frequency"].mode().iat[0]
        if "pulling_awareness" in beh.columns:
            sns.countplot(x=beh["pulling_awareness"], ax=axs[1], palette="coolwarm")
            axs[1].set_title("Pulling Awareness Level")
            summary_data["Top Awareness Level"] = beh["pulling_awareness"].mode().iat[0]
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "behaviour_freq_awareness.png"), dpi=150)
        plt.close(fig)
        log("✅ behaviour_freq_awareness.png saved.")
    except Exception as e:
        log(f"❌ Behaviour plotting error: {e}")

# ──────────────────────────────
# 3️⃣ Correlation Heatmap
# ──────────────────────────────
try:
    numeric_tables = ["demographics", "hair_pulling_behaviours_patterns"]
    numeric_data = []
    with sqlite3.connect(DB_PATH) as conn:
        for tbl in numeric_tables:
            df = safe_read(tbl)
            if not df.empty:
                numeric_data.append(df.select_dtypes("number"))
    if numeric_data:
        combined = pd.concat(numeric_data, axis=1)
        corr = combined.corr()
        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(corr, cmap="vlag", center=0, annot=False, ax=ax)
        ax.set_title("Correlation Heatmap (Numeric Features)")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "corr_heatmap.png"), dpi=150)
        plt.close(fig)
        log("✅ corr_heatmap.png saved.")
        top_pair = corr.unstack().sort_values(ascending=False).drop_duplicates()
        top_pair = top_pair[top_pair < 1]
        if not top_pair.empty:
            best = top_pair.index[0]
            summary_data["Strongest Correlation"] = f"{best[0]} vs {best[1]} ({top_pair.iloc[0]:.2f})"
except Exception as e:
    log(f"❌ Correlation heatmap error: {e}")

# ──────────────────────────────
# 4️⃣ How Long Since Last Pull
# ──────────────────────────────
if not beh.empty and "how_long_stopped" in beh.columns:
    try:
        plt.figure(figsize=(8, 4))
        sns.histplot(beh["how_long_stopped"].dropna(), bins=20, color="#8da0cb")
        plt.title("How Long Since Last Pull")
        plt.xlabel("Duration (text values)")
        plt.ylabel("Count")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "no_pull_streak_text.png"), dpi=150)
        plt.close()
        log("✅ no_pull_streak_text.png saved.")
        summary_data["Entries with 'how_long_stopped'"] = beh["how_long_stopped"].notna().sum()
    except Exception as e:
        log(f"❌ Error plotting 'how_long_stopped': {e}")

# ──────────────────────────────
# 5️⃣ Summary + Markdown Report
# ──────────────────────────────
try:
    summary_df = pd.DataFrame(list(summary_data.items()), columns=["Metric", "Value"])
    csv_path = os.path.join(OUT_SUMMARY, "EDA_summary.csv")
    md_path = os.path.join(OUT_REPORT, "EDA_report.md")

    summary_df.to_csv(csv_path, index=False)
    log(f"✅ Summary CSV saved → {csv_path}")

    with open(md_path, "w", encoding="utf-8") as md:
        md.write("# 🧠 TrichMind Exploratory Data Analysis Report\n")
        md.write(f"_Generated: {datetime.now():%Y-%m-%d %H:%M:%S}_\n\n")
        md.write("## 📊 Key Findings\n")
        for k, v in summary_data.items():
            md.write(f"- **{k}:** {v}\n")
        md.write("\n## 🖼️ Visuals\n")
        for f in os.listdir(OUT_PNG):
            md.write(f"- {f}\n")
        md.write("\n## 📁 Output Folder\n")
        md.write(f"`{EDA_DIR}`\n")
    log(f"✅ Markdown report saved → {md_path}")
except Exception as e:
    log(f"❌ Summary/report saving error: {e}")

# ──────────────────────────────
# Wrap Up
# ──────────────────────────────
log("──────────────────────────────────────────────")
log("🎉 EDA complete! Figures and reports saved.")
log("──────────────────────────────────────────────")
