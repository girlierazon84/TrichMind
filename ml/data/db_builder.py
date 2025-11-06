#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import sqlite3
import pandas as pd

from common.config import CSV_DIR_DEFAULT, DB_PATH, CSV_SEPARATOR
from common.utils import sanitize_table_name, read_csv_smart, to_sql_replace


# Set CSV_DIR to the default path; can be overridden by environment variable
CSV_DIR = Path(CSV_DIR_DEFAULT) # override by env TRICHMIND_BASE_DIR if needed

# Load CSV files from CSV_DIR into SQLite database at DB_PATH
def load_csv_to_sqlite(csv_path: Path, conn: sqlite3.Connection) -> None:
    table_name = sanitize_table_name(csv_path)
    df = read_csv_smart(csv_path, sep=CSV_SEPARATOR)
    if "id" not in df.columns:
        df.insert(0, "id", range(1, len(df) + 1))
    to_sql_replace(df, table_name, conn)
    print(f"✅ {table_name}: {len(df):,} rows")

# Main function to build the database
def main() -> None:
    print("\n🧩 TrichMind Database Builder — CSV → SQLite")
    CSV_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Find all CSV files in the CSV_DIR
    csv_files = sorted([p for p in CSV_DIR.glob("*.csv")])
    if not csv_files:
        raise SystemExit(f"No CSV files found in {CSV_DIR}")

    # Connect to SQLite database and load each CSV
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

# Run the main function if this script is executed
if __name__ == "__main__":
    main()