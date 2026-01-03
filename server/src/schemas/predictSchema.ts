// server/src/schemas/predictSchema.ts

import { z } from "zod";


/**-----------------------------------------
    🧠 Friendly/Core prediction payload
        Use this when calling FastAPI:
            POST /predict_friendly
--------------------------------------------*/
// Matches your Python FriendlyFeatures schema.
export const PredictSchema = z
    .object({
        age: z.coerce.number().min(0).max(120),
        age_of_onset: z.coerce.number().min(0).max(120),
        years_since_onset: z.coerce.number().min(0).max(120).optional(),

        pulling_severity: z.coerce.number().min(0).max(10),

        pulling_frequency: z.string().trim().min(1),
        pulling_awareness: z.string().trim().min(1),

        successfully_stopped: z.union([z.boolean(), z.string().trim()]),
        how_long_stopped_days: z.coerce.number().min(0),

        emotion: z.string().trim().min(1),

        // Optional lifestyle fields (your app logs these separately)
        sleepHours: z.coerce.number().min(0).max(24).optional(),
        stressLevel: z.coerce.number().min(0).max(10).optional(),
        exerciseMinutes: z.coerce.number().min(0).max(1440).optional(),
    })
    .strict();

// Infer the TypeScript type from the Zod schema
export type PredictDTO = z.infer<typeof PredictSchema>;

/**------------------------------------------------
    🌿 Relapse Overview payload (NEW)
    Use this when calling FastAPI:
            POST /predict_relapse_overview
    Matches your Python RelapseFeatures schema.
---------------------------------------------------*/
// Extended version of PredictSchema with more lifestyle/journal data.
export const PredictRelapseOverviewSchema = z
    .object({
        // Profile (same as friendly)
        age: z.coerce.number().min(0).max(120),
        age_of_onset: z.coerce.number().min(0).max(120),
        years_since_onset: z.coerce.number().min(0).max(120),

        pulling_severity: z.coerce.number().min(0).max(10),
        pulling_frequency: z.string().trim().min(1),
        pulling_awareness: z.string().trim().min(1),

        successfully_stopped: z.union([z.boolean(), z.string().trim()]),
        how_long_stopped_days: z.coerce.number().min(0),

        emotion: z.string().trim().min(1),

        // Journal – urges
        avg_urge_7d: z.coerce.number().min(0).max(10).default(0),
        avg_urge_30d: z.coerce.number().min(0).max(10).default(0),
        max_urge_7d: z.coerce.number().min(0).max(10).default(0),
        high_urge_events_7d: z.coerce.number().int().min(0).default(0),
        num_journal_entries_7d: z.coerce.number().int().min(0).default(0),
        num_journal_entries_30d: z.coerce.number().int().min(0).default(0),
        days_since_last_entry: z.coerce.number().int().min(0).default(999),

        // Journal – moods (0..1)
        pct_stress_moods_30d: z.coerce.number().min(0).max(1).default(0),
        pct_calm_moods_30d: z.coerce.number().min(0).max(1).default(0),
        pct_happy_moods_30d: z.coerce.number().min(0).max(1).default(0),

        // Journal – triggers (30d counts)
        count_trigger_stress_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_boredom_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_anxiety_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_fatigue_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_bodyfocus_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_screentime_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_social_30d: z.coerce.number().int().min(0).default(0),
        count_trigger_other_30d: z.coerce.number().int().min(0).default(0),

        // Health – sleep
        avg_sleep_7d: z.coerce.number().min(0).max(24).default(0),
        avg_sleep_30d: z.coerce.number().min(0).max(24).default(0),
        min_sleep_7d: z.coerce.number().min(0).max(24).default(0),
        short_sleep_nights_7d: z.coerce.number().int().min(0).max(7).default(0),

        // Health – stress (0..10)
        avg_health_stress_7d: z.coerce.number().min(0).max(10).default(0),
        avg_health_stress_30d: z.coerce.number().min(0).max(10).default(0),
        max_health_stress_7d: z.coerce.number().min(0).max(10).default(0),
        high_stress_days_7d: z.coerce.number().int().min(0).max(7).default(0),

        // Health – exercise
        avg_exercise_7d: z.coerce.number().min(0).max(1440).default(0),
        avg_exercise_30d: z.coerce.number().min(0).max(1440).default(0),
        days_with_any_exercise_7d: z.coerce.number().int().min(0).max(7).default(0),
        num_health_logs_7d: z.coerce.number().int().min(0).default(0),
        num_health_logs_30d: z.coerce.number().int().min(0).default(0),
        days_since_last_health_log: z.coerce.number().int().min(0).default(999),

        // Combined
        high_urge_and_high_stress_days_7d: z.coerce.number().int().min(0).default(0),
    })
    .strict();

// Infer the TypeScript type from the Zod schema
export type PredictRelapseOverviewDTO = z.infer<
    typeof PredictRelapseOverviewSchema
>;

/**----------------------------------------------------
    🧪 Encoded prediction payload (legacy/testing)
    Aligns to FastAPI /predict (raw)
-------------------------------------------------------*/
// Matches your Python EncodedFeatures schema.
export const PredictEncodedSchema = z
    .object({
        pulling_severity: z.coerce.number().min(0).max(10),
        pulling_frequency_encoded: z.coerce.number().int().min(0).max(5),
        awareness_level_encoded: z.coerce.number().min(0).max(1),
        how_long_stopped_days_est: z.coerce.number().min(0),

        // FIX: must be 0|1, not boolean
        successfully_stopped_encoded: z.coerce.number().int().min(0).max(1),

        years_since_onset: z.coerce.number().min(0),
        age: z.coerce.number().min(0),
        age_of_onset: z.coerce.number().min(0),

        emotion_intensity_sum: z.coerce.number().min(0).optional(),
        anxiety_level: z.coerce.number().min(0).max(1).optional(),
        depression_level: z.coerce.number().min(0).max(1).optional(),
        coping_strategies_effective: z.coerce.number().int().min(0).max(1).optional(),
        sleep_quality_score: z.coerce.number().min(0).max(10).optional(),

        // optional extended fields available in PredictIn (safe)
        avg_urge_7d: z.coerce.number().min(0).max(10).optional(),
        avg_urge_30d: z.coerce.number().min(0).max(10).optional(),
        max_urge_7d: z.coerce.number().min(0).max(10).optional(),
        high_urge_events_7d: z.coerce.number().min(0).optional(),
        avg_sleep_7d: z.coerce.number().min(0).max(24).optional(),
        short_sleep_nights_7d: z.coerce.number().int().min(0).max(7).optional(),
        avg_health_stress_7d: z.coerce.number().min(0).max(10).optional(),
        high_stress_days_7d: z.coerce.number().int().min(0).max(7).optional(),
        high_urge_and_high_stress_days_7d: z.coerce.number().min(0).optional(),
    })
    .strict();

// Infer the TypeScript type from the Zod schema
export type PredictEncodedDTO = z.infer<typeof PredictEncodedSchema>;

export default {
    PredictSchema,
    PredictRelapseOverviewSchema,
    PredictEncodedSchema,
};
