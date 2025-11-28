// server/src/types/relapseFeatures.ts

/**-------------------------------------------------------------
    Base relapse features currently used by the ML model.
    (This should match what you already had in ../services.)
----------------------------------------------------------------*/
export interface RelapseFeatures {
    age: number;
    age_of_onset: number;
    years_since_onset: number;

    pulling_severity: number;
    pulling_frequency: string;
    pulling_awareness: string;

    successfully_stopped: boolean | string;
    how_long_stopped_days: number;

    emotion: string;
}

/**----------------------------------------------------------------
    Extended relapse features:
        - profile (above)
        - + aggregates from Journal & Health logs
    All new fields are numeric and can be safely defaulted to 0
    if you have too little data.
-------------------------------------------------------------------*/
export interface RelapseFeaturesExtended extends RelapseFeatures {
    // ─────────────────────
    // Journal: urges
    // ─────────────────────
    avg_urge_7d: number;
    avg_urge_30d: number;
    max_urge_7d: number;
    high_urge_events_7d: number;   // count of entries with urge >= 7 (last 7d)
    num_journal_entries_7d: number;
    num_journal_entries_30d: number;
    days_since_last_entry: number;

    // ─────────────────────
    // Journal: moods
    // ─────────────────────
    pct_stress_moods_30d: number;  // share 0–1
    pct_calm_moods_30d: number;    // share 0–1
    pct_happy_moods_30d: number;   // share 0–1

    // ─────────────────────
    // Journal: triggers (Stress / Boredom / Anxiety / Fatigue / BodyFocus / ScreenTime / Social / Other)
    // counts over the last 30 days
    // ─────────────────────
    count_trigger_stress_30d: number;
    count_trigger_boredom_30d: number;
    count_trigger_anxiety_30d: number;
    count_trigger_fatigue_30d: number;
    count_trigger_bodyfocus_30d: number;
    count_trigger_screentime_30d: number;
    count_trigger_social_30d: number;
    count_trigger_other_30d: number;

    // ─────────────────────
    // Health: sleep
    // ─────────────────────
    avg_sleep_7d: number;
    avg_sleep_30d: number;
    min_sleep_7d: number;
    short_sleep_nights_7d: number; // nights with sleepHours < 6

    // ─────────────────────
    // Health: stress
    // ─────────────────────
    avg_health_stress_7d: number;
    avg_health_stress_30d: number;
    max_health_stress_7d: number;
    high_stress_days_7d: number;   // days with stressLevel >= 7

    // ─────────────────────
    // Health: exercise
    // ─────────────────────
    avg_exercise_7d: number;
    avg_exercise_30d: number;
    days_with_any_exercise_7d: number;

    num_health_logs_7d: number;
    num_health_logs_30d: number;
    days_since_last_health_log: number;

    // ─────────────────────
    // Combined: high risk combos
    // ─────────────────────
    high_urge_and_high_stress_days_7d: number;
}
