#!/usr/bin/env python3
from __future__ import annotations
import re
from pathlib import Path
import pandas as pd
import sqlite3

from .config import CSV_SEPARATOR


# Utility to read a CSV into a DataFrame
def sanitize_table_name(fname: str | Path) -> str:
    name = Path(fname).stem
    safe = re.sub(r"\W+", "_", name)
    return re.sub(r"_+", "_", safe).strip("_").lower()

# Utility to read a CSV into a DataFrame with encoding fallback
def read_csv_smart(path: Path, sep: str = CSV_SEPARATOR) -> pd.DataFrame:
    try:
        return pd.read_csv(path, sep=sep, encoding="utf-8")
    except UnicodeDecodeError:
        return pd.read_csv(path, sep=sep, encoding="latin-1")

# Utility to write a DataFrame to a SQL table, replacing if it exists
def to_sql_replace(df: pd.DataFrame, table: str, conn: sqlite3.Connection) -> None:
    df.to_sql(table, conn, if_exists="replace", index=False)
