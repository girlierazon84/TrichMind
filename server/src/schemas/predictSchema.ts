// server/src/schemas/predictSchema.ts

import { z } from "zod";

/**--------------------------------------------------------
    🧠 ML Prediction schema — Friendly payload
    Used by the app (register & predict, forecast, etc.)
-----------------------------------------------------------**/
export const PredictSchema = z.object({
    age: z.coerce.number().min(0),
    age_of_onset: z.coerce.number().min(0),
    years_since_onset: z.coerce.number().min(0).optional(),

    pulling_severity: z.coerce.number().min(0).max(10),

    // Friendly, human-readable fields
    pulling_frequency: z.string().min(1),
    pulling_awareness: z.string().min(1),
    successfully_stopped: z.union([z.string(), z.boolean()]),
    how_long_stopped_days: z.coerce.number().min(0),

    emotion: z.string().min(1),

    // Optional lifestyle fields (used for logging → HealthLog)
    sleepHours: z.coerce.number().min(0).max(24).optional(),
    stressLevel: z.coerce.number().min(0).max(10).optional(),
    exerciseMinutes: z.coerce.number().min(0).max(1440).optional(),
});

export type PredictDTO = z.infer<typeof PredictSchema>;

/**-----------------------------------------------------------
🧪 Encoded ML Prediction schema
Used ONLY for legacy / test encoded payloads → /api/ml/predict
--------------------------------------------------------------**/
export const PredictEncodedSchema = z.object({
    pulling_severity: z.coerce.number().min(0).max(10),
    pulling_frequency_encoded: z.coerce.number().min(0).max(5),
    awareness_level_encoded: z.coerce.number().min(0).max(1),
    how_long_stopped_days_est: z.coerce.number().min(0),
    successfully_stopped_encoded: z.coerce.number().min(0).max(1),

    years_since_onset: z.coerce.number().min(0),
    age: z.coerce.number().min(0),
    age_of_onset: z.coerce.number().min(0),

    emotion_intensity_sum: z.coerce.number().min(0).optional(),
    anxiety_level: z.coerce.number().min(0).max(1).optional(),
    depression_level: z.coerce.number().min(0).max(1).optional(),
    coping_strategies_effective: z.coerce.number().min(0).max(1).optional(),
    sleep_quality_score: z.coerce.number().min(0).max(10).optional(),
});

export type PredictEncodedDTO = z.infer<typeof PredictEncodedSchema>;
