#!/usr/bin/env python3
"""
ml/scripts/build_db.py - Build SQLite database from CSV files.

Usage:
    python scripts/build_db.py

Inputs:
    - CSV files in `common.config.CSV_DIR_DEFAULT`

Output:
    - SQLite database at `common.config.DB_PATH` containing tables
        derived from CSV files in `common.config.CSV_DIR_DEFAULT`.
"""

from __future__ import annotations

import sys
from pathlib import Path
import sqlite3

import pandas as pd


# -------------------------------------------------------------------------
# Ensure "ml/" is on sys.path so `import common.*` works when running:
#   (ml) python scripts/build_db.py
# -------------------------------------------------------------------------
ML_DIR = Path(__file__).resolve().parents[1]  # .../ml
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from common.config import CSV_DIR_DEFAULT, DB_PATH, CSV_SEPARATOR, ensure_artifact_dirs
from common.utils import sanitize_table_name, read_csv_smart, to_sql_replace


# Load CSV into SQLite
def load_csv_to_sqlite(csv_path: Path, conn: sqlite3.Connection) -> None:
    """Load one CSV into SQLite (table name derived from filename)."""
    table_name = sanitize_table_name(csv_path)
    df = read_csv_smart(csv_path, sep=CSV_SEPARATOR)

    if "id" not in df.columns:
        df.insert(0, "id", range(1, len(df) + 1))

    to_sql_replace(df, table_name, conn)
    print(f"✅ {table_name}: {len(df):,} rows")

# Main function
def main() -> None:
    print("\n🧩 TrichMind Database Builder — CSV → SQLite")
    ensure_artifact_dirs()

    csv_dir = Path(CSV_DIR_DEFAULT)
    csv_dir.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    csv_files = sorted(csv_dir.glob("*.csv"))
    if not csv_files:
        raise SystemExit(f"No CSV files found in {csv_dir}")

    conn = sqlite3.connect(DB_PATH)
    try:
        for p in csv_files:
            load_csv_to_sqlite(p, conn)

        conn.commit()

        tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table'", conn)
        print("\n📊 Tables:")
        for t in tables["name"].tolist():
            print(" •", t)

        print(f"\n✅ All CSVs loaded → {DB_PATH}")
    finally:
        conn.close()
        print("🔒 Connection closed.")


if __name__ == "__main__":
    main()
