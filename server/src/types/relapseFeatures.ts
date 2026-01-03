// server/src/types/relapseFeatures.ts

/**--------------------------------------------------------------
    Base features (profile) used for relapse risk prediction.
    Matches the "friendly" input shape consumed by FastAPI:
        - PredictFriendly / RelapseOverviewFeatures
-----------------------------------------------------------------*/
export interface RelapseFeaturesBase {
    age: number;
    age_of_onset: number;

    // Optional on the Node side (you can compute it if missing):
    // years_since_onset = age - age_of_onset
    years_since_onset?: number;

    pulling_severity: number; // 0..10
    pulling_frequency: string; // "daily" | "weekly" | etc (free text normalized server-side)
    pulling_awareness: string; // "yes" | "sometimes" | "no" (free text normalized)

    successfully_stopped: boolean | string; // allow boolean/string from UI
    how_long_stopped_days: number;

    emotion: string; // free text
}

/**-------------------------------------------------------------------
    Extended relapse overview features:
    (profile + journal + health aggregates)
    All extended fields are OPTIONAL so you can safely send
    partial data (default to 0 in your service before calling ML).
----------------------------------------------------------------------*/
export interface RelapseFeaturesExtended extends RelapseFeaturesBase {
    // ────────── Journal – urges ──────────
    avg_urge_7d?: number;
    avg_urge_30d?: number;
    max_urge_7d?: number;
    high_urge_events_7d?: number;

    num_journal_entries_7d?: number;
    num_journal_entries_30d?: number;
    days_since_last_entry?: number;

    // ────────── Journal – moods ──────────
    pct_stress_moods_30d?: number; // 0..1
    pct_calm_moods_30d?: number; // 0..1
    pct_happy_moods_30d?: number; // 0..1

    // ────────── Journal – triggers (30d counts) ──────────
    count_trigger_stress_30d?: number;
    count_trigger_boredom_30d?: number;
    count_trigger_anxiety_30d?: number;
    count_trigger_fatigue_30d?: number;
    count_trigger_bodyfocus_30d?: number;
    count_trigger_screentime_30d?: number;
    count_trigger_social_30d?: number;
    count_trigger_other_30d?: number;

    // ────────── Health – sleep ──────────
    avg_sleep_7d?: number;
    avg_sleep_30d?: number;
    min_sleep_7d?: number;
    short_sleep_nights_7d?: number;

    // ────────── Health – stress ──────────
    avg_health_stress_7d?: number;
    avg_health_stress_30d?: number;
    max_health_stress_7d?: number;
    high_stress_days_7d?: number;

    // ────────── Health – exercise ──────────
    avg_exercise_7d?: number;
    avg_exercise_30d?: number;
    days_with_any_exercise_7d?: number;

    num_health_logs_7d?: number;
    num_health_logs_30d?: number;
    days_since_last_health_log?: number;

    // ────────── Combined ──────────
    high_urge_and_high_stress_days_7d?: number;
}

/**--------------------------------------------------------------------
    Convenience alias: this is the shape you should send to FastAPI
        /predict_relapse_overview
-----------------------------------------------------------------------*/
export type RelapseOverviewPayload = RelapseFeaturesExtended;
