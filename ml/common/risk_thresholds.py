#!/usr/bin/env python3 === ml/common/risk_thresholds.py

from __future__ import annotations

from dataclasses import dataclass


# Single source of truth for risk thresholds & encoding
LOW_MAX = 0.49
HIGH_MIN = 0.70  # everything >= HIGH_MIN is high
# Medium is (LOW_MAX, HIGH_MIN)

LABELS = ["low", "medium", "high"]
ENCODING = {"low": 0, "medium": 1, "high": 2}
DECODE = {v: k for k, v in ENCODING.items()}

# Result of risk scoring
@dataclass(frozen=True)
class RiskResult:
    score: float       # 0..1 probability of HIGH
    bucket: str        # 'low' | 'medium' | 'high'
    code: int          # 0 | 1 | 2
    confidence: float  # 0..1, distance from 0.5

# Determine bucket from score
def bucket_from_score(score: float) -> str:
    s = float(score)
    if s >= HIGH_MIN:
        return "high"
    if s <= LOW_MAX:
        return "low"
    return "medium"

# Determine code from bucket
def code_from_bucket(bucket: str) -> int:
    return ENCODING.get(bucket, 0)

# Main function to get risk result from score
def risk_from_score(score: float) -> RiskResult:
    s = max(0.0, min(1.0, float(score)))
    b = bucket_from_score(s)
    c = code_from_bucket(b)
    conf = max(0.0, min(1.0, abs(s - 0.5) * 2))
    return RiskResult(score=round(s, 3), bucket=b, code=c, confidence=round(conf, 3))
