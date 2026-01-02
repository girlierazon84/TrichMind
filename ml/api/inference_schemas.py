"""
ml/inference_schemas.py - Pydantic schema for relapse prediction features.

Usage:
    from ml.inference_schemas import RelapseFeatures

    features = RelapseFeatures(
        age=25,
        age_of_onset=15,
        pulling_severity=7,
        pulling_frequency="daily",
        pulling_awareness="aware",
        successfully_stopped=False,
        how_long_stopped_days=0,
        emotion="stressed",
        # ... other fields with default values or specified values
    )
"""

from __future__ import annotations

from typing import Optional, Union
from pydantic import BaseModel, Field


# Relapse prediction feature schema
class RelapseFeatures(BaseModel):
    # ────────── Profile fields ──────────
    age: float = Field(..., ge=0, le=120)
    age_of_onset: float = Field(..., ge=0, le=120)
    years_since_onset: Optional[float] = Field(None, ge=0, le=120)

    pulling_severity: float = Field(..., ge=0, le=10)
    pulling_frequency: str
    pulling_awareness: str

    successfully_stopped: Union[bool, str]
    how_long_stopped_days: float = Field(..., ge=0)

    emotion: str

    # ────────── Journal – urges ──────────
    avg_urge_7d: float = 0.0
    avg_urge_30d: float = 0.0
    max_urge_7d: float = 0.0
    high_urge_events_7d: int = 0

    num_journal_entries_7d: int = 0
    num_journal_entries_30d: int = 0
    days_since_last_entry: int = Field(999, ge=0)

    # ────────── Journal – moods ──────────
    pct_stress_moods_30d: float = 0.0
    pct_calm_moods_30d: float = 0.0
    pct_happy_moods_30d: float = 0.0

    # ────────── Journal – triggers ──────────
    count_trigger_stress_30d: int = 0
    count_trigger_boredom_30d: int = 0
    count_trigger_anxiety_30d: int = 0
    count_trigger_fatigue_30d: int = 0
    count_trigger_bodyfocus_30d: int = 0
    count_trigger_screentime_30d: int = 0
    count_trigger_social_30d: int = 0
    count_trigger_other_30d: int = 0

    # ────────── Health – sleep ──────────
    avg_sleep_7d: float = 0.0
    avg_sleep_30d: float = 0.0
    min_sleep_7d: float = 0.0
    short_sleep_nights_7d: int = 0

    # ────────── Health – stress ──────────
    avg_health_stress_7d: float = 0.0
    avg_health_stress_30d: float = 0.0
    max_health_stress_7d: float = 0.0
    high_stress_days_7d: int = 0

    # ────────── Health – exercise ──────────
    avg_exercise_7d: float = 0.0
    avg_exercise_30d: float = 0.0
    days_with_any_exercise_7d: int = 0
    num_health_logs_7d: int = 0
    num_health_logs_30d: int = 0
    days_since_last_health_log: int = Field(999, ge=0)

    # ────────── Combined ──────────
    high_urge_and_high_stress_days_7d: int = 0
