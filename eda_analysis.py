#!/usr/bin/env python3
"""
eda_analysis.py

Perform Exploratory Data Analysis on your TTM SQLite database.

Reads from:
  - demographics_enriched
  - behaviour_enriched

Generates and saves:

  1. demographics.png            — age, gender, country, occupation, education, family history
  2. behaviour_freq_awareness.png— pulling frequency & awareness
  3. corr_heatmap.png            — correlation heatmap of key numeric features
  4. no_pull_streak_days.png     — days since last pull (if available)
  5. no_pull_streak_hours.png    — hours since last pull (if available)

All outputs go into `figures/png/`.
"""
import os
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# ── Setup ───────────────────────────────────────────────────────────────────────
OUT_DIR = "figures/png"
os.makedirs(OUT_DIR, exist_ok=True)

DB = "ttm_database.db"
conn = sqlite3.connect(DB)
demo = pd.read_sql("SELECT * FROM demographics_enriched", conn)
beh  = pd.read_sql("SELECT * FROM behaviour_enriched", conn)
conn.close()

sns.set_theme(style="whitegrid")


# 1) Demographics overview
fig, axs = plt.subplots(2, 3, figsize=(15, 8))
# Age
ax = axs[0,0]
sns.histplot(demo["age"].dropna(), bins=20, ax=ax)
ax.set_title("Age")
ax.set_xlabel("Years")
ax.set_ylabel("Count")
# Gender
ax = axs[0,1]
sns.countplot(y=demo["gender"], order=demo["gender"].value_counts().index, ax=ax)
ax.set_title("Gender")
ax.set_xlabel("Count")
ax.set_ylabel("Gender")
# Country
ax = axs[0,2]
sns.countplot(y=demo["country"], order=demo["country"].value_counts().index, ax=ax)
ax.set_title("Country")
ax.set_xlabel("Count")
ax.set_ylabel("Country")
# Occupation
ax = axs[1,0]
sns.countplot(y=demo["occupation"], order=demo["occupation"].value_counts().index, ax=ax)
ax.set_title("Occupation")
ax.set_xlabel("Count")
ax.set_ylabel("Occupation")
# Education level
ax = axs[1,1]
sns.countplot(y=demo["education_level"], order=demo["education_level"].value_counts().index, ax=ax)
ax.set_title("Education")
ax.set_xlabel("Count")
ax.set_ylabel("Education")
# Family history
ax = axs[1,2]
sns.countplot(y=demo["family_history"], order=demo["family_history"].value_counts().index, ax=ax)
ax.set_title("Family History")
ax.set_xlabel("Count")
ax.set_ylabel("Family History")

plt.tight_layout()
plt.savefig(f"{OUT_DIR}/demographics.png", dpi=150)
plt.close(fig)
print("✅ demographics.png")


# 2) Behaviour: pulling frequency & awareness
fig, axs = plt.subplots(1, 2, figsize=(12, 5))
# Frequency
ax = axs[0]
sns.histplot(beh["pulling_frequency_encoded"].dropna(), bins=5, ax=ax)
ax.set_title("Pulling Frequency")
ax.set_xlabel("1 (Rare) – 5 (Daily)")
ax.set_ylabel("Count")
# Awareness
ax = axs[1]
sns.histplot(beh["awareness_level_encoded"].dropna(), bins=5, ax=ax)
ax.set_title("Awareness Level")
ax.set_xlabel("0 (None) – 1 (Full)")
ax.set_ylabel("Count")

plt.tight_layout()
plt.savefig(f"{OUT_DIR}/behaviour_freq_awareness.png", dpi=150)
plt.close(fig)
print("✅ behaviour_freq_awareness.png")


# 3) Correlation heatmap of key numerics
# raw → display label mapping
label_map = {
    "age": "Age",
    "years_since_onset": "Years Since Onset",
    "pulling_frequency_encoded": "Frequency",
    "awareness_level_encoded": "Awareness",
    "pulling_severity": "Severity"
}

# build DataFrame of only those present
num_df = pd.DataFrame({
    label_map[c]: (demo[c] if c in demo.columns else beh[c])
    for c in label_map
    if c in demo.columns or c in beh.columns
})

fig, ax = plt.subplots(figsize=(6, 5))
sns.heatmap(
    num_df.corr(),
    annot=True,
    center=0,
    cmap="vlag",
    xticklabels=True,
    yticklabels=True,
    ax=ax
)
ax.set_title("Feature Correlation")

# rotate tick labels for readability
plt.setp(ax.get_xticklabels(), rotation=45, ha="right")
plt.setp(ax.get_yticklabels(), rotation=0)

plt.tight_layout()
plt.savefig(f"{OUT_DIR}/corr_heatmap.png", dpi=150)
plt.close(fig)
print("✅ corr_heatmap.png")


# 4) No‐pull streak (if available)
if "days_since_pull" in beh.columns:
    fig, ax = plt.subplots(figsize=(8, 4))
    sns.histplot(beh["days_since_pull"].dropna(), bins=20, ax=ax)
    ax.set_title("Days Since Last Pull")
    ax.set_xlabel("Days")
    ax.set_ylabel("Count")
    plt.tight_layout()
    plt.savefig(f"{OUT_DIR}/no_pull_streak_days.png", dpi=150)
    plt.close(fig)
    print("✅ no_pull_streak_days.png")

if "hours_since_pull" in beh.columns:
    fig, ax = plt.subplots(figsize=(8, 4))
    sns.histplot(beh["hours_since_pull"].dropna(), bins=20, ax=ax)
    ax.set_title("Hours Since Last Pull")
    ax.set_xlabel("Hours")
    ax.set_ylabel("Count")
    plt.tight_layout()
    plt.savefig(f"{OUT_DIR}/no_pull_streak_hours.png", dpi=150)
    plt.close(fig)
    print("✅ no_pull_streak_hours.png")


print("🎉 EDA complete!")
# ── End ─────────────────────────────────────────────────────────────────────────
