// server/src/schemas/healthSchema.ts

import { z } from "zod";

/**--------------------------------------------------
🩺 Health log schema
Used for tracking lifestyle/mental well-being stats.
-----------------------------------------------------**/
export const HealthCreateSchema = z.object({
    sleepHours: z.coerce.number().min(0).max(24).default(7),
    stressLevel: z.coerce.number().min(0).max(10).default(5),
    exerciseMinutes: z.coerce.number().min(0).max(1440).default(0),
    date: z.coerce.date().optional(), // defaults to now if missing
});
export type HealthCreate = z.infer<typeof HealthCreateSchema>;

export const HealthUpdateSchema = HealthCreateSchema.partial();
export type HealthUpdate = z.infer<typeof HealthUpdateSchema>;

export const HealthListQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["date", "-date", "createdAt", "-createdAt"]).default("-date"),
    userId: z.string().optional(), // used for admin contexts
});
export type HealthListQuery = z.infer<typeof HealthListQuerySchema>;

export const HealthIdParamSchema = z.object({
    id: z.string().length(24, "Invalid MongoDB ObjectId"),
});
export type HealthIdParam = z.infer<typeof HealthIdParamSchema>;
