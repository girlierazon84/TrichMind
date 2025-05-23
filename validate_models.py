#!/usr/bin/env python3
"""
validate_models.py

Run ROC and confusion matrix on best_model, using only numeric features.
"""
import os
import joblib
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import confusion_matrix, roc_curve, auc
from train_models import load_merged

# 1) Load pipeline & encoders
pipe = joblib.load("models/best_model.pkl")
le   = joblib.load("models/label_encoder.pkl")

# 2) Re-create hold-out split on numeric features only
df = load_merged()
if "relapse_risk_tag" not in df.columns:
    raise KeyError("'relapse_risk_tag' missing in merged data.")

# encode target
y = df["relapse_risk_tag"].astype(str)
le2 = LabelEncoder().fit(y)
y_enc = le2.transform(y)

# select solely the numeric columns you trained on
X_all = df.select_dtypes(include=[np.number])

# reproduce train/test with same seed & stratify
_, X_test, _, y_test = train_test_split(
    X_all, y_enc,
    test_size=0.2,
    stratify=y_enc,
    random_state=42
)

# 3) Predict probabilities & plot ROC
y_prob = pipe.predict_proba(X_test)

os.makedirs("figures/png", exist_ok=True)

plt.figure(figsize=(6,6))
for i, cls in enumerate(le2.classes_):
    fpr, tpr, _ = roc_curve((y_test == i).astype(int), y_prob[:, i])
    plt.plot(fpr, tpr, label=f"{cls.capitalize()} (AUC={auc(fpr, tpr):.2f})")
plt.plot([0,1], [0,1], "k--", linewidth=1)
plt.title("ROC Curves")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.legend(loc="lower right")
plt.tight_layout()
plt.savefig("figures/png/roc.png", dpi=150)
plt.close()

# 4) Confusion matrix
cm = confusion_matrix(y_test, pipe.predict(X_test))
fig, ax = plt.subplots(figsize=(5,5))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=le2.classes_,
    yticklabels=le2.classes_,
    ax=ax
)
ax.set_title("Confusion Matrix")
ax.set_xlabel("Predicted")
ax.set_ylabel("True")
plt.tight_layout()
plt.savefig("figures/png/confusion.png", dpi=150)
plt.close()

print("✅ Saved: figures/png/roc.png, figures/png/confusion.png")
print("✅ ROC and confusion matrix plots generated successfully.")
