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

All outputs saved to: ml/assets/figures/
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
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Projects\TrichMind_App\ml"
DB_PATH = os.path.join(BASE_DIR, "artifacts", "database", "ttm_database.db")
OUT_DIR = os.path.join(BASE_DIR, "assets", "figures")

# Output subfolders
OUT_PNG = os.path.join(OUT_DIR, "png")
OUT_SUMMARY = os.path.join(OUT_DIR, "summary_csv")
OUT_REPORT = os.path.join(OUT_DIR, "report_md")
LOG_PATH = os.path.join(OUT_DIR, "eda_log.txt")

for folder in [OUT_DIR, OUT_PNG, OUT_SUMMARY, OUT_REPORT]:
    os.makedirs(folder, exist_ok=True)

sns.set_theme(style="whitegrid")

# ──────────────────────────────
# Logging Helper
# ──────────────────────────────
def log(msg: str):
    print(msg)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(f"{msg}\n")

if os.path.exists(LOG_PATH):
    os.remove(LOG_PATH)

log("──────────────────────────────────────────────")
log(f"🧠 TrichMind EDA Session — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log("──────────────────────────────────────────────")

# ──────────────────────────────
# Database Connection
# ──────────────────────────────
if not os.path.exists(DB_PATH):
    log(f"❌ Database not found at: {DB_PATH}")
    raise FileNotFoundError(f"Database not found at: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)["name"].tolist()
log(f"📋 Tables found: {tables}")

def safe_read(table: str) -> pd.DataFrame:
    """Safely read a table if it exists."""
    if table in tables:
        log(f"✅ Reading table: {table}")
        df = pd.read_sql(f"SELECT * FROM {table}", conn)
        if "id" in df.columns:
            df = df.drop(columns=["id"])
        return df
    else:
        log(f"⚠️ Skipping missing table: {table}")
        return pd.DataFrame()

demo = safe_read("demographics")
beh = safe_read("hair_pulling_behaviours_patterns")
conn.close()

summary_data = {}

# ──────────────────────────────
# 1️⃣ Demographics Overview
# ──────────────────────────────
if not demo.empty:
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
                sns.histplot(demo[col].dropna(), bins=20, ax=ax)
                summary_data["Mean Age"] = round(demo[col].mean(), 2)
                summary_data["Median Age"] = round(demo[col].median(), 2)
            else:
                sns.countplot(y=demo[col], order=demo[col].value_counts().index, ax=ax)
                top_val = demo[col].mode()[0] if not demo[col].mode().empty else "N/A"
                summary_data[f"Most Common {title}"] = top_val
            ax.set_title(title)
            ax.set_xlabel("")
            ax.set_ylabel("Count")

    plt.tight_layout()
    plt.savefig(f"{OUT_PNG}/demographics.png", dpi=150)
    plt.close(fig)
    log("✅ Saved: demographics.png")

# ──────────────────────────────
# 2️⃣ Behavior: Frequency & Awareness
# ──────────────────────────────
if not beh.empty:
    fig, axs = plt.subplots(1, 2, figsize=(12, 5))
    if "pulling_frequency" in beh.columns:
        sns.countplot(x=beh["pulling_frequency"], ax=axs[0])
        axs[0].set_title("Pulling Frequency")
        summary_data["Most Common Pulling Frequency"] = (
            beh["pulling_frequency"].mode()[0] if not beh["pulling_frequency"].mode().empty else "N/A"
        )
    if "pulling_awareness" in beh.columns:
        sns.countplot(x=beh["pulling_awareness"], ax=axs[1])
        axs[1].set_title("Awareness Level")
        summary_data["Most Common Awareness Level"] = (
            beh["pulling_awareness"].mode()[0] if not beh["pulling_awareness"].mode().empty else "N/A"
        )

    plt.tight_layout()
    plt.savefig(f"{OUT_PNG}/behaviour_freq_awareness.png", dpi=150)
    plt.close(fig)
    log("✅ Saved: behaviour_freq_awareness.png")

# ──────────────────────────────
# 3️⃣ Correlation Heatmap
# ──────────────────────────────
numeric_dfs = []
for tbl in ["demographics", "hair_pulling_behaviours_patterns"]:
    conn = sqlite3.connect(DB_PATH)
    df = safe_read(tbl)
    conn.close()
    if not df.empty:
        numeric_dfs.append(df.select_dtypes(include="number"))

if numeric_dfs:
    combined = pd.concat(numeric_dfs, axis=1)
    corr = combined.corr()
    fig, ax = plt.subplots(figsize=(8, 6))
    sns.heatmap(corr, cmap="vlag", center=0, annot=False, ax=ax)
    ax.set_title("Correlation Heatmap (Numeric Features)")
    plt.tight_layout()
    plt.savefig(f"{OUT_PNG}/corr_heatmap.png", dpi=150)
    plt.close(fig)
    log("✅ Saved: corr_heatmap.png")

    corr_pairs = corr.unstack().sort_values(ascending=False).drop_duplicates()
    corr_pairs = corr_pairs[corr_pairs < 1]
    if not corr_pairs.empty:
        top_corr = corr_pairs.index[0]
        summary_data["Strongest Correlation"] = f"{top_corr[0]} vs {top_corr[1]} ({corr_pairs.iloc[0]:.2f})"

# ──────────────────────────────
# 4️⃣ How Long Since Last Pull
# ──────────────────────────────
if "how_long_stopped" in beh.columns:
    plt.figure(figsize=(8, 4))
    sns.histplot(beh["how_long_stopped"].dropna(), bins=20)
    plt.title("How Long Since Last Pull (Distribution)")
    plt.xlabel("Duration (text)")
    plt.ylabel("Count")
    plt.tight_layout()
    plt.savefig(f"{OUT_PNG}/no_pull_streak_text.png", dpi=200)
    plt.close()
    log("✅ Saved: no_pull_streak_text.png")
    summary_data["Entries with 'How Long Stopped'"] = beh["how_long_stopped"].notna().sum()

# ──────────────────────────────
# 5️⃣ Summary CSV + Markdown
# ──────────────────────────────
summary_df = pd.DataFrame(list(summary_data.items()), columns=["Metric", "Value"])
csv_path = os.path.join(OUT_SUMMARY, "EDA_summary.csv")
md_path = os.path.join(OUT_REPORT, "EDA_report.md")

summary_df.to_csv(csv_path, index=False)
log(f"✅ Summary CSV saved → {csv_path}")

# Generate Markdown report
with open(md_path, "w", encoding="utf-8") as md:
    md.write("# 🧠 TrichMind Exploratory Data Analysis Report\n")
    md.write(f"_Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_\n\n")

    md.write("## 📊 Key Findings\n\n")
    for k, v in summary_data.items():
        md.write(f"- **{k}:** {v}\n")

    md.write("\n## 🖼️ Generated Visualizations\n")
    md.write("- demographics.png — Participant demographics overview\n")
    md.write("- behaviour_freq_awareness.png — Behavioral patterns\n")
    md.write("- corr_heatmap.png — Correlation relationships\n")
    md.write("- no_pull_streak_text.png — Recovery streak distribution\n")

    md.write("\n## 📁 Files Saved To\n")
    md.write(f"`{OUT_DIR}`\n")

log(f"✅ Markdown report saved → {md_path}")

# ──────────────────────────────
# Wrap Up
# ──────────────────────────────
log("\n📋 Summary Preview:")
log(summary_df.to_string(index=False))
log("🎉 EDA complete! All figures and reports saved successfully.")
