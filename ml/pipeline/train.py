#!/usr/bin/env python3
from __future__ import annotations
import json
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
import sqlite3
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from ml.common.config import (
DB_PATH, FEATURES_JSON, LABEL_ENCODER, MODEL_PATH,
TRAIN_LOG, TRAIN_METRICS_CSV, TRAIN_HISTORY_CSV
)
from ml.common.transformers import ColumnSelector
from ml.common.risk import LABELS # enforce order ['low','medium','high']


# Set random seed for reproducibility
SEED = 42
np.random.seed(SEED)

# Load features configuration
def log(msg: str) -> None:
    print(msg)
    TRAIN_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(TRAIN_LOG, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# Load feature configuration
def load_table() -> pd.DataFrame:
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
    conn.close()
    if "relapse_risk_tag" in df.columns:
        df = df.drop(columns=["relapse_risk_tag"]) # ensure no stale target
    return df


if __name__ == "__main__":
    # Initialize log
    open(TRAIN_LOG, "w").close()
    log("──── TrichMind Training start ────")

    # Load data
    df = load_table()
    feature_names: list[str] = json.load(open(FEATURES_JSON, "r", encoding="utf-8"))

    # Target creation (rule-based for initial phase): use 'pulling_severity' & 'awareness_level_encoded'
    # Build y according to business rule & risk thresholds (consistent across codebase)
    sev = df.get("pulling_severity", pd.Series([0]*len(df)))
    aw = df.get("awareness_level_encoded", pd.Series([0.0]*len(df)))
    y_text = np.where((sev >= 7) & (aw <= 0.5), "high",
                np.where(sev >= 5, "medium", "low"))

    # Lock label order low<medium<high → 0,1,2
    le = LabelEncoder()
    le.classes_ = np.array(LABELS, dtype=object) # set desired order
    y_enc = le.transform(y_text)
    joblib.dump(le, LABEL_ENCODER)
    log(f"Saved label encoder → {LABEL_ENCODER} (classes={LABELS})")

    # Prepare feature matrix
    X = df[feature_names].copy()

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=SEED
    )

    # Model candidates
    candidates = {
        "LogReg": Pipeline([( "sel", ColumnSelector(feature_names) ), ("clf", LogisticRegression(max_iter=1000, random_state=SEED))]),
        "RF": Pipeline([( "sel", ColumnSelector(feature_names) ), ("clf", RandomForestClassifier(n_estimators=300, random_state=SEED))]),
        "GB": Pipeline([( "sel", ColumnSelector(feature_names) ), ("clf", GradientBoostingClassifier(n_estimators=200, random_state=SEED))]),
        "MLP": Pipeline([( "sel", ColumnSelector(feature_names) ), ("clf", MLPClassifier(hidden_layer_sizes=(96,48), max_iter=600, random_state=SEED))]),
    }

    # Cross-validation to select best model
    best_name, best_score, best_pipe = None, -1.0, None
    log("5-fold CV (accuracy):")
    for name, pipe in candidates.items():
        try:
            sc = cross_val_score(pipe, X_train, y_train, cv=5, scoring="accuracy").mean()
            log(f" • {name:<6} = {sc:.3f}")
            if sc > best_score:
                best_name, best_score, best_pipe = name, sc, pipe
        except Exception as e:
            log(f" ! {name} skipped: {e}")

    if best_pipe is None:
        raise SystemExit("No model trained")

    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)

    # Evaluate on test set
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    # Save
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    setattr(best_pipe, "feature_names_", feature_names)
    setattr(best_pipe, "class_labels_", LABELS)
    joblib.dump(best_pipe, MODEL_PATH)

    pd.DataFrame([[best_name, acc, prec, rec, f1]], columns=["Model","Accuracy","Precision","Recall","F1"]).to_csv(TRAIN_METRICS_CSV, index=False)

    # Append to training history
    hist_row = pd.DataFrame([{"Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "Model": best_name, "Accuracy": acc, "Precision": prec, "Recall": rec, "F1": f1}])
    hist_row.to_csv(TRAIN_HISTORY_CSV, mode="a", header=not TRAIN_HISTORY_CSV.exists(), index=False)

    # Log results
    log(f"Best={best_name} CV={best_score:.3f} | Test Acc={acc:.3f}")
    log(f"Model → {MODEL_PATH}")
    log(f"Metrics → {TRAIN_METRICS_CSV}")
    log("──── Training complete ────")