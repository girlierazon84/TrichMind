#!/usr/bin/env python3 === ml/common/utils.py

from __future__ import annotations

import re
import sqlite3
from pathlib import Path

import pandas as pd

from common.config import CSV_SEPARATOR


# Sanitize a file name to be used as a SQL table name
def sanitize_table_name(fname: str | Path) -> str:
    name = Path(fname).stem
    safe = re.sub(r"\W+", "_", name)
    return re.sub(r"_+", "_", safe).strip("_").lower()

# Read a CSV file with automatic encoding detection
def read_csv_smart(path: Path, sep: str = CSV_SEPARATOR) -> pd.DataFrame:
    try:
        return pd.read_csv(path, sep=sep, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(path, sep=sep, encoding="latin-1")

# Write a DataFrame to a SQL table, replacing it if it exists
def to_sql_replace(df: pd.DataFrame, table: str, conn: sqlite3.Connection) -> None:
    df.to_sql(table, conn, if_exists="replace", index=False)
