#!/usr/bin/env python3
"""
test_models.py

Load best_model, label_encoder, evaluate on hold-out set (numeric features only).
"""
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
from train_models import load_merged

# 1) Load best pipeline & encoder
pipe = joblib.load("models/best_model.pkl")
le   = joblib.load("models/label_encoder.pkl")

# 2) Reconstruct the same data & labels
df = load_merged()
if "relapse_risk_tag" not in df.columns:
    raise KeyError("'relapse_risk_tag' missing in merged data.")
y = df["relapse_risk_tag"].astype(str)

# re-fit a fresh encoder so classes_ align
le2   = LabelEncoder().fit(y)
y_enc = le2.transform(y)

# 3) Select numeric features exactly as in train_models.py
X = df.select_dtypes(include=[np.number])

# 4) Hold-out split (same seed & test_size)
_, X_test, _, y_test = train_test_split(
    X, y_enc, test_size=0.2, stratify=y_enc, random_state=42
)

# 5) Predict & report
y_pred = pipe.predict(X_test)
print(f"\nTest Accuracy: {accuracy_score(y_test, y_pred):.3f}\n")
print(
    classification_report(
        y_test,
        y_pred,
        target_names=le2.classes_,
        zero_division=0
    )
)
