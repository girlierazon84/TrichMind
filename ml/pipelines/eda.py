#!/usr/bin/env python3
"""
eda.py — Exploratory Data Analysis for TrichMind TTM Database

Performs visual and statistical EDA on the TrichMind SQLite database.

Generates:
    - demographics.png             — Age, gender, country, education, occupation, family history
    - behaviour_freq_awareness.png — Pulling frequency and awareness levels
    - corr_heatmap.png             — Correlation matrix of numeric variables
    - no_pull_streak_text.png      — Distribution of 'how_long_stopped'
    - EDA_summary.csv              — Key metrics and stats
    - EDA_report.md                — Markdown summary report
    - eda_log.txt                  — Log of EDA run steps

All outputs saved to: ml/artifacts/eda/
"""

import os
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# ──────────────────────────────
# Setup
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml"
DB_PATH = os.path.join(BASE_DIR, "artifacts", "database", "ttm_database.db")

# EDA output directories
EDA_DIR = os.path.join(BASE_DIR, "artifacts", "eda")
OUT_PNG = os.path.join(EDA_DIR, "figures")
OUT_SUMMARY = os.path.join(EDA_DIR, "summary")
OUT_REPORT = os.path.join(EDA_DIR, "report")
LOG_PATH = os.path.join(EDA_DIR, "eda_log.txt")

for folder in [EDA_DIR, OUT_PNG, OUT_SUMMARY, OUT_REPORT]:
    os.makedirs(folder, exist_ok=True)

sns.set_theme(style="whitegrid")

# ──────────────────────────────
# Logging Helper
# ──────────────────────────────
def log(msg: str):
    """Prints and writes logs."""
    print(msg)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(f"{msg}\n")

# Reset old log
if os.path.exists(LOG_PATH):
    os.remove(LOG_PATH)

log("──────────────────────────────────────────────")
log(f"🧠 TrichMind EDA Session — {datetime.now():%Y-%m-%d %H:%M:%S}")
log("──────────────────────────────────────────────")

# ──────────────────────────────
# Database Connection
# ──────────────────────────────
if not os.path.exists(DB_PATH):
    log(f"❌ Database not found at: {DB_PATH}")
    raise FileNotFoundError(DB_PATH)

conn = sqlite3.connect(DB_PATH)
tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)["name"].tolist()
log(f"📋 Tables found: {tables}")

def safe_read(table: str, connection) -> pd.DataFrame:
    """Safely read a table if it exists."""
    if table in tables:
        log(f"✅ Reading table: {table}")
        df = pd.read_sql(f"SELECT * FROM {table}", connection)
        if "id" in df.columns:
            df = df.drop(columns=["id"])
        return df
    else:
        log(f"⚠️ Skipping missing table: {table}")
        return pd.DataFrame()

# Read core tables
demo = safe_read("demographics", conn)
beh = safe_read("hair_pulling_behaviours_patterns", conn)
summary_data = {}

# ──────────────────────────────
# 1️⃣ Demographics Overview
# ──────────────────────────────
if not demo.empty:
    try:
        fig, axs = plt.subplots(2, 3, figsize=(15, 8))
        axs = axs.flatten()
        plots = [
            ("age", "Age (Years)", "hist"),
            ("gender", "Gender", "count"),
            ("country", "Country", "count"),
            ("occupation", "Occupation", "count"),
            ("education_level", "Education Level", "count"),
            ("family_history", "Family History", "count"),
        ]
        for i, (col, title, kind) in enumerate(plots):
            if col in demo.columns:
                ax = axs[i]
                if kind == "hist":
                    sns.histplot(demo[col].dropna(), bins=20, kde=True, ax=ax, color="#66c2a5")
                    summary_data["Mean Age"] = round(demo[col].mean(), 2)
                    summary_data["Median Age"] = round(demo[col].median(), 2)
                else:
                    # ✅ Fixed warning by adding hue and legend=False
                    sns.countplot(y=demo[col], order=demo[col].value_counts().index,
                                  ax=ax, hue=demo[col], legend=False, palette="coolwarm")
                    top_val = demo[col].mode()[0] if not demo[col].mode().empty else "N/A"
                    summary_data[f"Most Common {title}"] = top_val
                ax.set_title(title)
                ax.set_xlabel("")
                ax.set_ylabel("Count")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "demographics.png"), dpi=150)
        plt.close(fig)
        log("✅ Saved: demographics.png")
    except Exception as e:
        log(f"❌ Error plotting demographics: {e}")

# ──────────────────────────────
# 2️⃣ Behavior: Frequency & Awareness
# ──────────────────────────────
if not beh.empty:
    try:
        fig, axs = plt.subplots(1, 2, figsize=(12, 5))
        if "pulling_frequency" in beh.columns:
            sns.countplot(x=beh["pulling_frequency"], hue=beh["pulling_frequency"],
                          legend=False, ax=axs[0], palette="crest")
            axs[0].set_title("Pulling Frequency")
            summary_data["Most Common Pulling Frequency"] = beh["pulling_frequency"].mode()[0]
        if "pulling_awareness" in beh.columns:
            sns.countplot(x=beh["pulling_awareness"], hue=beh["pulling_awareness"],
                          legend=False, ax=axs[1], palette="flare")
            axs[1].set_title("Awareness Level")
            summary_data["Most Common Awareness Level"] = beh["pulling_awareness"].mode()[0]
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "behaviour_freq_awareness.png"), dpi=150)
        plt.close(fig)
        log("✅ Saved: behaviour_freq_awareness.png")
    except Exception as e:
        log(f"❌ Error plotting behaviour: {e}")

# ──────────────────────────────
# 3️⃣ Correlation Heatmap
# ──────────────────────────────
try:
    numeric_dfs = []
    # ✅ Use the existing open connection
    for tbl in ["demographics", "hair_pulling_behaviours_patterns"]:
        df = safe_read(tbl, conn)
        if not df.empty:
            numeric_dfs.append(df.select_dtypes(include="number"))

    if numeric_dfs:
        combined = pd.concat(numeric_dfs, axis=1)
        corr = combined.corr()
        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(corr, cmap="vlag", center=0, annot=False, ax=ax)
        ax.set_title("Correlation Heatmap (Numeric Features)")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "corr_heatmap.png"), dpi=150)
        plt.close(fig)
        log("✅ Saved: corr_heatmap.png")

        corr_pairs = corr.unstack().sort_values(ascending=False).drop_duplicates()
        corr_pairs = corr_pairs[corr_pairs < 1]
        if not corr_pairs.empty:
            top_corr = corr_pairs.index[0]
            summary_data["Strongest Correlation"] = f"{top_corr[0]} vs {top_corr[1]} ({corr_pairs.iloc[0]:.2f})"
except Exception as e:
    log(f"❌ Error generating correlation heatmap: {e}")
finally:
    conn.close()  # ✅ Close safely after all SQL operations are done

# ──────────────────────────────
# 4️⃣ How Long Since Last Pull
# ──────────────────────────────
if "how_long_stopped" in beh.columns:
    try:
        plt.figure(figsize=(8, 4))
        sns.histplot(beh["how_long_stopped"].dropna(), bins=20, color="#8da0cb")
        plt.title("How Long Since Last Pull (Distribution)")
        plt.xlabel("Duration (text values)")
        plt.ylabel("Count")
        plt.tight_layout()
        plt.savefig(os.path.join(OUT_PNG, "no_pull_streak_text.png"), dpi=200)
        plt.close()
        log("✅ Saved: no_pull_streak_text.png")
        summary_data["Entries with 'How Long Stopped'"] = beh["how_long_stopped"].notna().sum()
    except Exception as e:
        log(f"❌ Error plotting 'how_long_stopped': {e}")

# ──────────────────────────────
# 5️⃣ Summary CSV + Markdown
# ──────────────────────────────
try:
    summary_df = pd.DataFrame(list(summary_data.items()), columns=["Metric", "Value"])
    csv_path = os.path.join(OUT_SUMMARY, "EDA_summary.csv")
    md_path = os.path.join(OUT_REPORT, "EDA_report.md")

    summary_df.to_csv(csv_path, index=False)
    log(f"✅ Summary CSV saved → {csv_path}")

    with open(md_path, "w", encoding="utf-8") as md:
        md.write("# 🧠 TrichMind Exploratory Data Analysis Report\n")
        md.write(f"_Generated on {datetime.now():%Y-%m-%d %H:%M:%S}_\n\n")
        md.write("## 📊 Key Findings\n\n")
        for k, v in summary_data.items():
            md.write(f"- **{k}:** {v}\n")
        md.write("\n## 🖼️ Generated Visualizations\n")
        md.write("- demographics.png — Participant demographics overview\n")
        md.write("- behaviour_freq_awareness.png — Behavioral patterns\n")
        md.write("- corr_heatmap.png — Correlation relationships\n")
        md.write("- no_pull_streak_text.png — Recovery streak distribution\n")
        md.write("\n## 📁 Output Folder\n")
        md.write(f"`{EDA_DIR}`\n")

    log(f"✅ Markdown report saved → {md_path}")
except Exception as e:
    log(f"❌ Error saving EDA summary/report: {e}")

# ──────────────────────────────
# Wrap Up
# ──────────────────────────────
log("\n📋 Summary Preview:")
if "summary_df" in locals() and not summary_df.empty:
    log(summary_df.to_string(index=False))
log("🎉 EDA complete! All figures and reports saved successfully.")
log("──────────────────────────────────────────────")
