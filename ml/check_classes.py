"""
ml/scripts/check_classes.py - Script to check and print the classes
of the label encoder and the active model's classifier.

Usage:
    python check_classes.py

This script loads the active model and label encoder, then prints
their classes to the console for verification.
"""

import joblib
from pathlib import Path

from common.config import MODEL_PATH, LABEL_ENCODER
from common.model_registry import read_current_model_pointer


# Resolve the active model path
def resolve_model_path() -> Path:
    """
    Prefer the active model from models/current_model.json.
    Fall back to MODEL_PATH from config if pointer missing/invalid.
    """
    p = read_current_model_pointer()
    if p and isinstance(p, dict):
        active = p.get("active") or {}
        path_str = active.get("path")
        if path_str:
            mp = Path(path_str)
            if mp.exists():
                return mp
    return Path(MODEL_PATH)

# Load model and label encoder
model_path = resolve_model_path()
# Load the model and label encoder
model = joblib.load(model_path)
label_encoder = joblib.load(LABEL_ENCODER)

print("✅ Active model path:", str(model_path))
print("✅ Label encoder classes:", list(getattr(label_encoder, "classes_", [])))

# Access inner classifier if model is a pipeline
inner = getattr(model, "named_steps", {}).get("clf", model)
if hasattr(inner, "classes_"):
    print("✅ Model classifier classes:", list(inner.classes_))
else:
    print("⚠️ No inner classifier classes_ attribute found.")
