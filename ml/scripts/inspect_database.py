#!/usr/bin/env python3
"""
ml/scripts/inspect_database.py — Summarize all tables in the TrichMind SQLite DB.
Outputs a text overview next to the DB file.

Usage:
    python scripts/inspect_database.py

Output:
    - Text file `database_overview.txt` next to the DB file summarizing
        all tables, their columns, and sample rows.
"""

from __future__ import annotations

import sys
import sqlite3
from pathlib import Path

import pandas as pd

# Ensure "ml/" is on sys.path so `import common.*` works when running:
#   (ml) python scripts/inspect_database.py
ML_DIR = Path(__file__).resolve().parents[1]
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import DB_PATH, ensure_artifact_dirs


# Main script
def main() -> None:
    ensure_artifact_dirs()

    if not DB_PATH.exists():
        raise FileNotFoundError(f"❌ Database not found at: {DB_PATH}")

    out_path = DB_PATH.parent / "database_overview.txt"

    with sqlite3.connect(DB_PATH) as conn, out_path.open("w", encoding="utf-8") as f:
        tables = pd.read_sql(
            "SELECT name FROM sqlite_master WHERE type='table';", conn
        )["name"].tolist()

        f.write(f"📋 Tables found ({len(tables)}): {tables}\n\n")

        for tbl in tables:
            f.write(f"===== {tbl} =====\n")

            info = pd.read_sql(f"PRAGMA table_info({tbl});", conn)
            f.write("Columns:\n")
            for _, row in info.iterrows():
                f.write(f"  - {row['name']} ({row['type']})\n")

            df = pd.read_sql(f"SELECT * FROM {tbl} LIMIT 5;", conn)
            f.write("\nSample rows (first 5):\n")
            f.write(df.to_string(index=False))
            f.write("\n\n")

    print(f"✅ Database summary saved to: {out_path}")


if __name__ == "__main__":
    main()
