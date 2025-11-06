#!/usr/bin/env python3
from __future__ import annotations
from dataclasses import dataclass


# Single source of truth for risk thresholds & encoding
LOW_MAX = 0.49
MED_MAX = 0.69 # medium upper bound
HIGH_MIN = 0.70

# Risk labels and their encodings
LABELS = ["low", "medium", "high"]
ENCODING = {"low": 0, "medium": 1, "high": 2}
DECODE = {v: k for k, v in ENCODING.items()}

# RiskResult holds the result of a risk assessment
@dataclass(frozen=True)
class RiskResult:
    score: float # 0..1 probability of HIGH
    bucket: str # 'low' | 'medium' | 'high'
    code: int # 0 | 1 | 2
    confidence: float # 0..1, distance from 0.5

# Create RiskResult from score
def bucket_from_score(score: float) -> str:
    if score >= HIGH_MIN:
        return "high"
    if score >= 0.50 and score <= MED_MAX:
        return "medium"
    return "low"

# Get encoding code from bucket label
def code_from_bucket(bucket: str) -> int:
    return ENCODING.get(bucket, 0)

# Create RiskResult from score
def risk_from_score(score: float) -> RiskResult:
    b = bucket_from_score(score)
    c = code_from_bucket(b)
    conf = max(0.0, min(1.0, abs(score - 0.5) * 2))
    return RiskResult(score=round(float(score), 3), bucket=b, code=c, confidence=round(conf, 3))