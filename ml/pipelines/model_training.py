#!/usr/bin/env python3
"""
model_training.py — TrichMind Relapse Risk Model Training & Metrics Logging

Trains multiple relapse-risk prediction models based on preprocessed data
from the TrichMind pipeline. Performs 5-fold cross-validation, trains a
deep learning MLP, compares results, and logs performance over time.

Outputs:
    • best_model.pkl + versioned copies (best_model_YYYYMMDD_HHMMSS.pkl)
    • label_encoder.pkl
    • training_log.txt
    • training_metrics.csv
    • model_performance_history.csv
"""

import os
import sqlite3
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
import keras
import warnings
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score
)
from scikeras.wrappers import KerasClassifier

warnings.filterwarnings("ignore")

# ──────────────────────────────
# Paths & Directories
# ──────────────────────────────
BASE_DIR = r"C:\Users\girli\OneDrive\Desktop\Portfolio-Projects\TrichMind\ml"
DB_PATH = os.path.join(BASE_DIR, "artifacts", "database", "ttm_database.db")
OUT_DIR = os.path.join(BASE_DIR, "artifacts", "best_models")
LOG_PATH = os.path.join(BASE_DIR, "artifacts", "logs", "training_log.txt")
METRICS_PATH = os.path.join(BASE_DIR, "artifacts", "metrics_csv", "training_metrics.csv")
HISTORY_PATH = os.path.join(BASE_DIR, "artifacts", "metrics_csv", "training_performance_history.csv")

for folder in [OUT_DIR, os.path.dirname(LOG_PATH), os.path.dirname(METRICS_PATH)]:
    os.makedirs(folder, exist_ok=True)

SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)

# ──────────────────────────────
# Logging Helper
# ──────────────────────────────
def log(msg: str):
    """Write message to console and log file."""
    print(msg)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(msg + "\n")

# ──────────────────────────────
# Data Loader
# ──────────────────────────────
def load_preprocessed():
    """Load preprocessed relapse risk feature dataset from SQLite."""
    conn = sqlite3.connect(DB_PATH)
    tables = pd.read_sql("SELECT name FROM sqlite_master WHERE type='table';", conn)["name"].tolist()

    if "relapse_risk_model_features" not in tables:
        raise ValueError("❌ Table 'relapse_risk_model_features' not found in database.")

    df = pd.read_sql("SELECT * FROM relapse_risk_model_features", conn)
    conn.close()

    if "relapse_risk_tag" not in df.columns:
        raise ValueError("❌ Missing target column 'relapse_risk_tag' in table.")

    log(f"📥 Loaded preprocessed dataset — {len(df)} rows, {len(df.columns)} cols")
    return df

# ──────────────────────────────
# Build Keras MLP
# ──────────────────────────────
def build_keras_mlp(input_dim: int, n_classes: int):
    """Simple MLP architecture for relapse-risk classification."""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(32, activation="relu"),
        keras.layers.Dense(n_classes, activation="softmax")
    ])
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model

# ──────────────────────────────
# Metrics Recorder
# ──────────────────────────────
def record_metrics(model_name, y_true, y_pred, metrics_df):
    """Compute accuracy, precision, recall, and F1 for a given model."""
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_true, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_true, y_pred, average="weighted", zero_division=0)
    metrics_df.loc[len(metrics_df)] = [model_name, acc, prec, rec, f1]
    return metrics_df, acc, prec, rec, f1

# ──────────────────────────────
# ASCII Trend Chart
# ──────────────────────────────
def draw_ascii_trend(history_path: str):
    """Render text-based trend chart for Accuracy and F1 from history file."""
    if not os.path.exists(history_path):
        log("📉 No previous history yet — first run.")
        return

    hist = pd.read_csv(history_path)
    if hist.empty or "Accuracy" not in hist.columns:
        return

    log("\n📈 Historical Performance Trend (last 10 runs):")
    for _, row in hist.tail(10).iterrows():
        acc_bar = "█" * int(row["Accuracy"] * 50)
        f1_bar = "▒" * int(row["F1"] * 50)
        log(f"{row['Date']} | {row['Model']:<15} | Acc: {row['Accuracy']:.3f} {acc_bar}")
        log(f"{' ' * 25} | F1 : {row['F1']:.3f} {f1_bar}")
    log("───────────────────────────────────────────────")

# ──────────────────────────────
# Training Pipeline
# ──────────────────────────────
if __name__ == "__main__":
    start_time = datetime.now()
    if os.path.exists(LOG_PATH):
        os.remove(LOG_PATH)

    log("───────────────────────────────────────────────")
    log(f"🧠 TrichMind Model Training — {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"📂 Database Path: {DB_PATH}")
    log("───────────────────────────────────────────────")

    try:
        df = load_preprocessed()
    except Exception as e:
        log(f"❌ Failed to load dataset: {e}")
        exit(1)

    # Prepare data
    y = df["relapse_risk_tag"].astype(str)
    X = df.select_dtypes(include=[np.number])

    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    joblib.dump(le, os.path.join(OUT_DIR, "label_encoder.pkl"))
    log("✅ Saved label_encoder.pkl")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=SEED
    )

    models = {
        "LogisticRegression": Pipeline([
            ("scale", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, random_state=SEED))
        ]),
        "RandomForest": Pipeline([
            ("scale", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=200, random_state=SEED))
        ]),
        "GradientBoosting": Pipeline([
            ("scale", StandardScaler()),
            ("clf", GradientBoostingClassifier(n_estimators=150, random_state=SEED))
        ]),
        "MLPClassifier": Pipeline([
            ("scale", StandardScaler()),
            ("clf", MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, random_state=SEED))
        ]),
    }

    metrics_df = pd.DataFrame(columns=["Model", "Accuracy", "Precision", "Recall", "F1"])

    log("\n🏋️ Running 5-Fold Cross-Validation...")
    best_score, best_model_name, best_pipe = -np.inf, None, None
    for name, pipe in models.items():
        try:
            scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring="accuracy")
            mean_acc = scores.mean()
            log(f" • {name:<18} CV Accuracy = {mean_acc:.3f}")
            if mean_acc > best_score:
                best_score, best_model_name, best_pipe = mean_acc, name, pipe
        except Exception as e:
            log(f"⚠️ Skipping {name}: {e}")

    log(f"\n✅ Best ML model after CV: {best_model_name} ({best_score:.3f})")
    best_pipe.fit(X_train, y_train)
    y_pred = best_pipe.predict(X_test)
    metrics_df, acc_ml, prec_ml, rec_ml, f1_ml = record_metrics(best_model_name, y_test, y_pred, metrics_df)

    # Deep Learning Model
    log("\n🤖 Training Deep Learning Keras MLP...")
    n_classes = len(np.unique(y_enc))
    keras_pipe = Pipeline([
        ("scale", StandardScaler()),
        ("clf", KerasClassifier(
            model=build_keras_mlp,
            model__input_dim=X_train.shape[1],
            model__n_classes=n_classes,
            epochs=25,
            batch_size=32,
            verbose=0,
            random_state=SEED
        ))
    ])
    keras_pipe.fit(X_train, y_train)
    y_pred_k = keras_pipe.named_steps["clf"].predict(keras_pipe.named_steps["scale"].transform(X_test))
    metrics_df, acc_keras, prec_keras, rec_keras, f1_keras = record_metrics("Keras MLP", y_test, y_pred_k, metrics_df)

    # Select Final Best Model
    if acc_keras > best_score:
        final_model, winner, acc, prec, rec, f1 = keras_pipe, "Keras MLP", acc_keras, prec_keras, rec_keras, f1_keras
    else:
        final_model, winner, acc, prec, rec, f1 = best_pipe, best_model_name, acc_ml, prec_ml, rec_ml, f1_ml

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    versioned_model_path = os.path.join(OUT_DIR, f"best_model_{timestamp}.pkl")

    joblib.dump(final_model, versioned_model_path)
    joblib.dump(final_model, os.path.join(OUT_DIR, "best_model.pkl"))
    metrics_df.to_csv(METRICS_PATH, index=False)

    # Append to History
    hist_entry = pd.DataFrame([{
        "Date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "Model": winner,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1
    }])
    hist_entry.to_csv(HISTORY_PATH, mode="a", index=False, header=not os.path.exists(HISTORY_PATH))

    # Logs & Summary
    log(f"\n🏆 Final Best Model: {winner}")
    log(f"✅ Saved model → {versioned_model_path}")
    log(f"📊 Metrics CSV → {METRICS_PATH}")
    log(f"📈 History updated → {HISTORY_PATH}")

    draw_ascii_trend(HISTORY_PATH)

    runtime = (datetime.now() - start_time).total_seconds()
    log(f"⏱️ Runtime: {runtime:.2f} seconds")
    log("🎉 Model training complete!")
    log("───────────────────────────────────────────────")
