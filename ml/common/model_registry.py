#!/usr/bin/env python3 === ml/common/model_registry.py

from __future__ import annotations

import json
import os
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from common.config import (
    MODEL_NAME,
    MODEL_VERSION,
    MODEL_FILENAME,
    MODEL_PATH,
    LABEL_ENCODER_PATH,
    SCALER_PATH,
    FEATURES_JSON,
    CURRENT_MODEL_JSON,
)


# Helper to compute sha256 of a file
def _sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str | None:
    """Return sha256 of a file, or None if it doesn't exist."""
    if not path.exists():
        return None
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()

# Atomic write JSON helper
def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    """
    Atomic write:
    - write to temp file in same dir
    - fsync
    - replace target
    This avoids partially-written JSON on crashes/redeploys.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")

    data = json.dumps(payload, indent=2, sort_keys=True)
    with tmp.open("w", encoding="utf-8") as f:
        f.write(data)
        f.flush()
        os.fsync(f.fileno())

    tmp.replace(path)

# Write or update the CURRENT_MODEL_JSON file
def write_current_model_pointer(
    *,
    best_model_path: Path | None = None,
    model_name: str | None = None,
    model_version: int | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Writes/updates CURRENT_MODEL_JSON describing the active/best model.

    Pass best_model_path/model_name/model_version when training picks a new best.
    Otherwise it will default to env/config values.
    """
    best_model_path = Path(best_model_path) if best_model_path else Path(MODEL_PATH)
    model_name = (model_name or MODEL_NAME).strip() or "best_model"
    model_version = int(model_version if model_version is not None else MODEL_VERSION)

    payload: dict[str, Any] = {
        "active": {
            "name": model_name,
            "version": model_version,
            "filename": Path(best_model_path).name,
            "path": str(best_model_path),
        },
        "artifacts": {
            "encoder_path": str(LABEL_ENCODER_PATH),
            "scaler_path": str(SCALER_PATH),
            "features_json": str(FEATURES_JSON),
        },
        "hashes": {
            "model_sha256": _sha256_file(best_model_path),
            "encoder_sha256": _sha256_file(Path(LABEL_ENCODER_PATH)),
            "scaler_sha256": _sha256_file(Path(SCALER_PATH)),
            "features_sha256": _sha256_file(Path(FEATURES_JSON)),
        },
        "updated_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    if extra:
        payload["meta"] = extra  # metrics, notes, dataset version, etc.

    _atomic_write_json(Path(CURRENT_MODEL_JSON), payload)
    return payload

# Read the CURRENT_MODEL_JSON file
def read_current_model_pointer() -> dict[str, Any] | None:
    """Reads CURRENT_MODEL_JSON if present, else returns None."""
    p = Path(CURRENT_MODEL_JSON)
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))
