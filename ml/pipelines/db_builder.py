#!/usr/bin/env python3
"""
db_builder.py — TrichMind CSV → SQLite Database Loader

Scans a directory for semicolon-delimited CSV files and loads each into
a SQLite database as its own table. Each table receives a 1-based `id`
column as a pseudo–primary key.

Key Features:
    • UTF-8 → Latin-1 fallback for encoding
    • Automatic directory creation
    • Full path verification and DB summary
    • Clean and safe table names

Usage:
    python db_builder.py
"""

import os
import re
import sqlite3
import pandas as pd

# ──────────────────────────────
# Configuration
# ──────────────────────────────
CSV_DIR   = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\assets\csv_files"
DB_PATH   = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml\artifacts\database\ttm_database.db"
SEPARATOR = ';'  # semicolon-delimited

# ──────────────────────────────
# Utility Functions
# ──────────────────────────────
def sanitize_table_name(filename: str) -> str:
    """
    Create a safe SQLite table name from the CSV filename.
    """
    name, _ = os.path.splitext(os.path.basename(filename))
    sanitized = re.sub(r'\W+', '_', name)
    return re.sub(r'_+', '_', sanitized).strip('_').lower()

def load_csv_to_sqlite(csv_path: str, conn: sqlite3.Connection):
    """
    Load a CSV file into SQLite as a table with an `id` column.
    """
    table_name = sanitize_table_name(csv_path)
    print(f"⏳ Loading '{csv_path}' → table '{table_name}'...")

    # 1️⃣ Try to read CSV (UTF-8, fallback Latin-1)
    try:
        df = pd.read_csv(csv_path, sep=SEPARATOR, encoding='utf-8')
    except UnicodeDecodeError:
        print("⚠️ UTF-8 failed — retrying with Latin-1 encoding...")
        df = pd.read_csv(csv_path, sep=SEPARATOR, encoding='latin-1')

    # 2️⃣ Inject ID column
    df.insert(0, 'id', range(1, len(df) + 1))

    # 3️⃣ Write to SQLite
    try:
        df.to_sql(table_name, conn, if_exists='replace', index=False)
        print(f"✅ Table '{table_name}' created with {len(df):,} rows.")
    except Exception as e:
        print(f"❌ Failed to create table '{table_name}': {e}")

# ──────────────────────────────
# Main Builder
# ──────────────────────────────
def main():
    """
    Build SQLite database from all CSV files in CSV_DIR.
    """
    print("────────────────────────────────────────────────────────────")
    print("🧩 TrichMind Database Builder — CSV → SQLite")
    print("────────────────────────────────────────────────────────────")
    print(f"📂 CSV source directory: {CSV_DIR}")

    if not os.path.isdir(CSV_DIR):
        raise FileNotFoundError(f"❌ CSV directory not found: {CSV_DIR}")

    # Ensure DB directory exists
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    # Connect to DB
    conn = sqlite3.connect(DB_PATH)
    print(f"🔌 Connected to SQLite → {DB_PATH}\n")

    try:
        csv_files = [f for f in os.listdir(CSV_DIR) if f.lower().endswith(".csv")]
        if not csv_files:
            print("⚠️ No CSV files found in directory.")
            return

        for fname in csv_files:
            full_path = os.path.join(CSV_DIR, fname)
            load_csv_to_sqlite(full_path, conn)

        # Commit all changes
        conn.commit()

        # List all tables for confirmation
        tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)
        print("\n📊 Database Build Summary:")
        for t in tables['name']:
            print(f"   • {t}")
        print(f"\n✅ All CSVs successfully loaded into → {DB_PATH}")

    except Exception as e:
        print(f"❌ Error while building database: {e}")

    finally:
        conn.close()
        print("🔒 SQLite connection closed.")
        print("────────────────────────────────────────────────────────────")

if __name__ == "__main__":
    main()
