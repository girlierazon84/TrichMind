// server/src/schemas/healthSchema.ts

import { z } from "zod";


// Custom validator for MongoDB ObjectId
const objectId = z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid MongoDB ObjectId");

// Schema for creating a health record
export const HealthCreateSchema = z
    .object({
        sleepHours: z.coerce.number().min(0).max(24).default(7),
        stressLevel: z.coerce.number().min(0).max(10).default(5),
        exerciseMinutes: z.coerce.number().min(0).max(1440).default(0),
        date: z.coerce.date().optional(),
    })
    .strict();

// Type for creating a health record
export type HealthCreateDTO = z.infer<typeof HealthCreateSchema>;

// Schema for updating a health record
export const HealthUpdateSchema = HealthCreateSchema.partial().strict();
export type HealthUpdateDTO = z.infer<typeof HealthUpdateSchema>;

// Schema for querying health records with pagination and filters
export const HealthListQuerySchema = z
    .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.enum(["date", "-date", "createdAt", "-createdAt"]).default("-date"),
        userId: z.string().optional(),
    })
    .strict();

// Type for querying health records
export type HealthListQueryDTO = z.infer<typeof HealthListQuerySchema>;

// Schema for validating health record ID parameter
export const HealthIdParamSchema = z.object({ id: objectId }).strict();
export type HealthIdParamDTO = z.infer<typeof HealthIdParamSchema>;

export default {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
    HealthIdParamSchema,
};
