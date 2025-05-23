#!/usr/bin/env python3
"""
train_models.py

Load demographics_enriched & behaviour_enriched plus all *_flags tables,
merge into one numeric feature matrix, derive relapse_risk_tag,
run 5-fold CV over pure scikit-learn classifiers, pick the best,
then train & evaluate a small Keras MLP on the hold-out set,
and finally save `best_model.pkl` and `label_encoder.pkl`.
"""

import os
import sqlite3
import joblib
import pandas as pd
import numpy as np
import tensorflow as tf
import keras

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import accuracy_score
from scikeras.wrappers import KerasClassifier

# ─── SETTINGS ───────────────────────────────────────────────────────────────────
DB_PATH = "ttm_database.db"
OUT_DIR = "models"
os.makedirs(OUT_DIR, exist_ok=True)
SEED = 42
np.random.seed(SEED)
tf.random.set_seed(SEED)


def compute_relapse_tag(df: pd.DataFrame) -> pd.DataFrame:
    """Derive relapse_risk_tag from pulling_severity and awareness_level_encoded."""
    def _tag(r):
        sev = r.get("pulling_severity", 0)
        aw  = r.get("awareness_level_encoded", 0.0)
        if sev >= 7 and aw <= 0.5:
            return "high"
        if sev >= 5:
            return "moderate"
        return "low"
    df["relapse_risk_tag"] = df.apply(_tag, axis=1)
    return df


def load_merged() -> pd.DataFrame:
    """
    1. Read demographics_enriched and behaviour_enriched.
    2. Inner-join on id.
    3. Read every *_flags table, drop duplicate ids, keep its 'flag' column,
       rename to <table>_flag, join it in, and add count_<table>.
    4. Return a DataFrame filled with zeros.
    """
    conn = sqlite3.connect(DB_PATH)

    demo = pd.read_sql("SELECT * FROM demographics_enriched", conn).set_index("id")
    beh  = pd.read_sql("SELECT * FROM behaviour_enriched",    conn).set_index("id")
    df   = demo.join(beh, how="inner")

    flags = pd.read_sql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%\\_flags' ESCAPE '\\'",
        conn
    )["name"].tolist()

    for tbl in flags:
        sub = pd.read_sql(f"SELECT * FROM {tbl}", conn)
        if "id" not in sub.columns or "flag" not in sub.columns:
            continue
        sub = sub.drop_duplicates(subset="id").set_index("id")[["flag"]]
        sub = sub.rename(columns={"flag": f"{tbl}_flag"})
        df = df.join(sub, how="left")
        df[f"count_{tbl}"] = sub.sum(axis=1)

    conn.close()
    return df.fillna(0)


def build_keras_mlp(input_dim: int, n_classes: int):
    """Simple Keras MLP for multiclass relapse-risk."""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dense(32, activation="relu"),
        keras.layers.Dense(n_classes, activation="softmax")
    ])
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


if __name__ == "__main__":
    # 1) Load & merge
    print("🔍 Loading & merging tables…")
    df = load_merged()

    # 2) Ensure target exists
    if "relapse_risk_tag" not in df.columns:
        df = compute_relapse_tag(df)

    # 3) Encode target
    y = df["relapse_risk_tag"].astype(str)
    le = LabelEncoder()
    y_enc = le.fit_transform(y)
    joblib.dump(le, os.path.join(OUT_DIR, "label_encoder.pkl"))
    print("✅ Saved label_encoder.pkl")

    # 4) Keep only numeric features
    X = df.select_dtypes(include=[np.number])

    # 5) Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_enc, test_size=0.2, stratify=y_enc, random_state=SEED
    )

    # 6) Define pure scikit-learn pipelines
    sklearn_pipelines = {
        "LogReg": Pipeline([
            ("scale", StandardScaler()),
            ("clf",    LogisticRegression(max_iter=1000, random_state=SEED))
        ]),
        "RandomForest": Pipeline([
            ("scale", StandardScaler()),
            ("clf",    RandomForestClassifier(
                n_estimators=100,
                min_samples_leaf=1,
                max_features="sqrt",
                random_state=SEED))
        ]),
        "GradientBoosting": Pipeline([
            ("scale", StandardScaler()),
            ("clf",    GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                random_state=SEED))
        ]),
        "MLP_sklearn": Pipeline([
            ("scale", StandardScaler()),
            ("clf",    MLPClassifier(
                hidden_layer_sizes=(50,50),
                max_iter=500,
                random_state=SEED))
        ]),
    }

    # 7) 5-fold CV on scikit-learn models
    print("🏋️  Running 5-fold CV on scikit-learn pipelines…")
    best_score, best_name, best_pipe = -np.inf, None, None
    for name, pipe in sklearn_pipelines.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=5, scoring="accuracy")
        mean_acc = scores.mean()
        print(f" • {name:<17} CV accuracy = {mean_acc:.3f}")
        if mean_acc > best_score:
            best_score, best_name, best_pipe = mean_acc, name, pipe

    print(f"\n✅ Best scikit-learn model: {best_name} (CV acc = {best_score:.3f})")
    print("🔨 Retraining best scikit-learn pipeline on full train set…")
    best_pipe.fit(X_train, y_train)

    # 8) Train & evaluate Keras MLP on hold-out
    print("\n🤖 Training & evaluating Keras MLP on hold-out…")
    n_classes = len(np.unique(y_enc))
    keras_pipe = Pipeline([
        ("scale", StandardScaler()),
        ("clf",    KerasClassifier(
            model=build_keras_mlp,
            model__input_dim=X_train.shape[1],
            model__n_classes=n_classes,
            epochs=20,
            batch_size=32,
            verbose=0,
            random_state=SEED
        ))
    ])
    keras_pipe.fit(X_train, y_train)

    # manually scale & predict to avoid sklearn-pipeline predict bug
    X_test_scaled = keras_pipe.named_steps["scale"].transform(X_test)
    y_pred_keras  = keras_pipe.named_steps["clf"].predict(X_test_scaled)
    keras_acc     = accuracy_score(y_test, y_pred_keras)
    print(f" • Keras MLP test accuracy = {keras_acc:.3f}")

    # 9) Decide final winner
    if keras_acc > best_score:
        print(f"🎉 Keras MLP wins with {keras_acc:.3f}! Saving it as best_model.")
        final_pipe = keras_pipe
    else:
        print(f"🎉 {best_name} remains best. Saving it as best_model.")
        final_pipe = best_pipe

    joblib.dump(final_pipe, os.path.join(OUT_DIR, "best_model.pkl"))
    print("✅ Saved best_model.pkl under `models/`")
    print("✅ All done! 🎉")
