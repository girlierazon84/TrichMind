// server/src/schemas/predictSchema.ts

import { z } from "zod";

/**-----------------------------------------------------------
🧠 ML Prediction schema
Payload used for relapse-risk prediction via FastAPI service.
--------------------------------------------------------------**/
export const PredictDTO = z.object({
    age: z.coerce.number().min(0),
    age_of_onset: z.coerce.number().min(0),
    years_since_onset: z.coerce.number().optional(),

    pulling_severity: z.coerce.number().min(0).max(10),
    pulling_frequency: z.string().min(1),
    pulling_awareness: z.string().min(1),
    successfully_stopped: z.string().or(z.boolean()),
    how_long_stopped_days: z.coerce.number().min(0),

    emotion: z.string().min(1),
});

export type PredictDTO = z.infer<typeof PredictDTO>;
