// server/src/schemas/healthSchema.ts

import { z } from "zod";

/**--------------------------------------------------------
    🩺 Health log schema
    Used for tracking lifestyle/mental well-being stats.
-----------------------------------------------------------**/
export const HealthCreateSchema = z.object({
    sleepHours: z.coerce.number().min(0).max(24).default(7),
    stressLevel: z.coerce.number().min(0).max(10).default(5),
    exerciseMinutes: z.coerce.number().min(0).max(1440).default(0),
    date: z.coerce.date().optional(), // defaults to now if missing
});
// Type for creating health logs
export type HealthCreate = z.infer<typeof HealthCreateSchema>;

// Schema for updating health logs (all fields optional)
export const HealthUpdateSchema = HealthCreateSchema.partial();
// Type for updating health logs
export type HealthUpdate = z.infer<typeof HealthUpdateSchema>;

// Schema for listing/querying health logs
export const HealthListQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["date", "-date", "createdAt", "-createdAt"]).default("-date"),
    userId: z.string().optional(), // used for admin contexts
});
// Type for listing health logs
export type HealthListQuery = z.infer<typeof HealthListQuerySchema>;

// Schema for health log ID parameter
export const HealthIdParamSchema = z.object({
    id: z.string().length(24, "Invalid MongoDB ObjectId"),
});
// Type for health log ID parameter
export type HealthIdParam = z.infer<typeof HealthIdParamSchema>;

export default {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
    HealthIdParamSchema,
};
