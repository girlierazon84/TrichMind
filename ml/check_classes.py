import joblib
from common.config import MODEL_PATH, LABEL_ENCODER

model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(LABEL_ENCODER)

print("Label encoder classes:", list(label_encoder.classes_))

inner = getattr(model, "named_steps", {}).get("clf", model)
if hasattr(inner, "classes_"):
    print("Model classifier classes:", list(inner.classes_))
else:
    print("No inner classifier classes_ attribute found.")
