#!/usr/bin/env python3
"""
inspect_database.py — Summarize all tables in ttm_database.db
"""

import sqlite3
import pandas as pd
from pathlib import Path

DB_PATH = Path(r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\artifacts\database\ttm_database.db")
OUT_PATH = DB_PATH.parent / "database_overview.txt"

with sqlite3.connect(DB_PATH) as conn, open(OUT_PATH, "w", encoding="utf-8") as f:
    # List all tables
    tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)["name"].tolist()
    f.write(f"📋 Tables found: {tables}\n\n")

    for tbl in tables:
        f.write(f"===== {tbl} =====\n")
        df = pd.read_sql(f"SELECT * FROM {tbl} LIMIT 5;", conn)
        info = pd.read_sql(f"PRAGMA table_info({tbl});", conn)
        f.write("Columns:\n")
        for _, row in info.iterrows():
            f.write(f"  - {row['name']} ({row['type']})\n")
        f.write("\nSample rows:\n")
        f.write(df.to_string(index=False))
        f.write("\n\n")

print(f"✅ Database summary saved to: {OUT_PATH}")
