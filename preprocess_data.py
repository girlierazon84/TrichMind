#!/usr/bin/env python3
"""
preprocess_data.py

Loads all raw tables, computes derived features, writes back
an enriched SQLite database for analysis and modeling.
"""
import sqlite3
import pandas as pd

DB = "ttm_database.db"


def tag_relapse_risk(df):
    """Tag each row as high/moderate/low relapse risk."""
    def _tag(r):
        sev = r.get("pulling_severity", 0)
        aw  = r.get("awareness_level_encoded", 0.0)
        if sev >= 7 and aw <= 0.5: return "high"
        if sev >= 5:               return "moderate"
        return "low"

    df["relapse_risk_tag"] = df.apply(_tag, axis=1)
    return df


def enrich_demographics(conn):
    demo = pd.read_sql("SELECT * FROM demographics", conn)
    # age & years_since_onset
    if {"age", "age_of_onset"}.issubset(demo.columns):
        demo["years_since_onset"] = demo["age"] - demo["age_of_onset"]
    demo.to_sql("demographics_enriched", conn, if_exists="replace", index=False)
    print("✅ demographics_enriched written")


def enrich_behaviour(conn):
    beh = pd.read_sql("SELECT * FROM hair_pulling_behaviours_patterns", conn)

    # 1) pulling_frequency → numeric
    if "pulling_frequency" in beh.columns:
        freq_map = {
            "Daily":5, "Several times a week":4,
            "Weekly":3, "Monthly":2, "Rarely":1
        }
        beh["pulling_frequency_encoded"] = (
            beh["pulling_frequency"]
            .map(freq_map)
            .fillna(0)
            .astype(int)
        )

    # 2) pulling_awareness → numeric
    if "pulling_awareness" in beh.columns:
        aw_map = {"Yes":1.0, "Sometimes":0.5, "No":0.0}
        beh["awareness_level_encoded"] = (
            beh["pulling_awareness"]
            .map(aw_map)
            .fillna(0.0)
        )

    # 3) relapse_risk_tag
    beh = tag_relapse_risk(beh)

    # 4) no-pull streak
    if "last_pull_timestamp" in beh.columns:
        beh["last_pull_ts"] = pd.to_datetime(beh["last_pull_timestamp"])
        delta = pd.Timestamp.now() - beh["last_pull_ts"]
        beh["hours_since_pull"] = delta.dt.total_seconds() / 3600
        beh["days_since_pull"]  = delta.dt.days

    beh.to_sql("behaviour_enriched", conn, if_exists="replace", index=False)
    print("✅ behaviour_enriched written")


def enrich_binary_tables(conn):
    """
    For each binary table, drop duplicate ids, melt 0/1 columns,
    filter to the 1s, clean feature names, rename 'flag' to '<tbl>_flag',
    and write out <tbl>_flags.
    """
    binary_tables = [
        "activities",
        "body_parts_pulled",
        "pulling_environment",
        "seasons_affect_pulling_intensity",
        "pulling_triggers",
        "emotions_before_pulling",
        "emotions_after_pulling",
        "coping_strategies_tried",
        "effective_coping_strategies",
        "other_mental_health_conditions"
    ]

    for tbl in binary_tables:
        df = pd.read_sql(f"SELECT * FROM {tbl}", conn)

        # 1) drop any truly duplicated id rows
        df = df.drop_duplicates(subset="id", keep="first")

        # 2) pick only 0/1 columns
        bin_cols = [
            c for c in df.columns
            if c != "id" and set(df[c].dropna().unique()) <= {0,1}
        ]
        if not bin_cols:
            print(f"⚠️ {tbl}: no binary cols found, skipping")
            continue

        # 3) melt
        m = df.melt(
            id_vars="id",
            value_vars=bin_cols,
            var_name="feature",
            value_name="flag"
        )

        # 4) keep only the 1s
        m = m[m["flag"] == 1].copy()

        # 5) clean feature names
        m["feature"] = (
            m["feature"]
             .str.replace("_", " ")
             .str.title()
             .str.replace(r"\bNone\b|\bUnknown\b", "", regex=True)
             .str.strip()
        )
        m = m[m["feature"] != ""]

        # 6) rename flag → <tbl>_flag
        flag_col = f"{tbl}_flag"
        m = m.rename(columns={"flag": flag_col})

        # 7) write out enriched flags table
        out_table = f"{tbl}_flags"
        m.to_sql(out_table, conn, if_exists="replace", index=False)
        print(f"✅ {out_table} written")


def main():
    """
    Main function to run the preprocessing steps.
    """
    conn = sqlite3.connect(DB)
    enrich_demographics(conn)
    enrich_behaviour(conn)
    enrich_binary_tables(conn)
    conn.close()
    print("🎉 All preprocessing complete.")


if __name__ == "__main__":
    main()
