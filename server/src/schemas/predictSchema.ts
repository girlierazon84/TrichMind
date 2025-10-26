// server/src/schemas/predictSchema.ts
import { z } from "zod";

/**
 * 🧠 ML Prediction schema
 * Payload used for relapse-risk prediction via FastAPI service.
 */
export const PredictDTO = z.object({
    age: z.number().min(0).max(120).default(30),
    age_of_onset: z.number().min(0).max(120).default(15),
    years_since_onset: z.number().min(0).default(0),
    pulling_severity: z.number().min(0).max(10),
    pulling_frequency_encoded: z.number().int().min(0).max(5),
    awareness_level_encoded: z.number().min(0).max(1),
    successfully_stopped_encoded: z.number().int().min(0).max(1).default(0),
    how_long_stopped_days_est: z.number().min(0).default(0),
    emotion: z.string().min(1).default("unknown"),
});
export type PredictDTO = z.infer<typeof PredictDTO>;
