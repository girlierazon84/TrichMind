#!/usr/bin/env python3
"""
db_builder.py

This script scans a directory for semicolon-delimited CSV files and loads each
into a SQLite database as its own table, injecting an `id` column (1,2,3…)
as a primary‐key–style field. It will try UTF-8 first, then fall back
to Latin-1 if there are decoding errors.

Usage:
    python database_builder.py

Configuration:
    CSV_DIR : directory containing your CSV files
    DB_PATH : path to the SQLite database file to create/update
    SEPARATOR: delimiter used in your CSV files
"""

import os
import re
import sqlite3
import pandas as pd

# === Configuration ===
CSV_DIR   = r"C:\Users\girli\OneDrive\Desktop\Projects\TrichMind_App\ml\assets\csv_files"
DB_PATH   = r"C:\Users\girli\OneDrive\Desktop\Projects\TrichMind_App\ml\artifacts\database\ttm_database.db"
SEPARATOR = ';'  # semicolon-delimited

def sanitize_table_name(filename: str) -> str:
    """
    Create a safe SQLite table name from the CSV filename.
    """
    name, _ = os.path.splitext(os.path.basename(filename))
    sanitized = re.sub(r'\W+', '_', name)
    return re.sub(r'_+', '_', sanitized).strip('_').lower()

def load_csv_to_sqlite(csv_path: str, conn: sqlite3.Connection):
    """
    Read a semicolon-delimited CSV (with fallback encoding), inject an `id`
    column, then write it into the SQLite database under a table named after
    the file.
    """
    table_name = sanitize_table_name(csv_path)
    print(f"⏳ Loading '{csv_path}' into table '{table_name}'...")

    # 1) Load into pandas, try utf-8 then latin-1
    try:
        df = pd.read_csv(csv_path, sep=SEPARATOR, encoding='utf-8')
    except UnicodeDecodeError:
        print("⚠️ UTF-8 failed, retrying with Latin-1...")
        df = pd.read_csv(csv_path, sep=SEPARATOR, encoding='latin-1')

    # 2) Inject an `id` column (1-based)
    df.insert(0, 'id', range(1, len(df) + 1))

    # 3) Write to SQLite (replace table if it exists)
    df.to_sql(table_name, conn, if_exists='replace', index=False)
    print(f"✅ Table '{table_name}' created with {len(df):,} rows (id as first column).")

def main():
    """
    Connect to SQLite and load every CSV in CSV_DIR into its own table.
    """
    if not os.path.isdir(CSV_DIR):
        raise FileNotFoundError(f"CSV directory not found: {CSV_DIR}")

    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    print(f"🔌 Connected to SQLite at '{DB_PATH}'")

    try:
        for fname in os.listdir(CSV_DIR):
            if fname.lower().endswith('.csv'):
                full_path = os.path.join(CSV_DIR, fname)
                load_csv_to_sqlite(full_path, conn)
    finally:
        conn.commit()
        conn.close()
        print("🔒 Database connection closed.")

if __name__ == "__main__":
    main()