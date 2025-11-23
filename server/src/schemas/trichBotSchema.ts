// server/src/schemas/trichBotSchema.ts

import { z } from "zod";

/**-------------------------------------------------
    🤖 TrichBot AI schema
    Stores chat interactions, tips, and feedback.
----------------------------------------------------**/
export const TrichBotCreateSchema = z.object({
    prompt: z.string().min(1),
    response: z.string().min(1),
    tips: z.array(z.string()).optional(),
    riskScore: z.coerce.number().min(0).max(1).optional(),
    intent: z.string().optional(),
    model: z
        .object({
            name: z.string().optional(),
            version: z.string().optional(),
        })
        .optional(),
    feedback: z
        .object({
            helpful: z.boolean().optional(),
            rating: z.coerce.number().int().min(1).max(5).optional(),
            comment: z.string().optional(),
        })
        .optional(),
});
// DTO type for creating a TrichBot entry
export type TrichBotCreate = z.infer<typeof TrichBotCreateSchema>;
// DTO type for creating a TrichBot entry
export type TrichBotCreateDTO = TrichBotCreate;

// Schema for updating TrichBot entries (all fields optional)
export const TrichBotUpdateSchema = TrichBotCreateSchema.partial();
// DTO type for updating a TrichBot entry
export type TrichBotUpdate = z.infer<typeof TrichBotUpdateSchema>;
// DTO type for updating a TrichBot entry
export type TrichBotUpdateDTO = TrichBotUpdate;

// Schema for querying TrichBot entries with pagination and filtering
export const TrichBotListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin / support tooling
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
// DTO type for listing TrichBot entries
export type TrichBotListQuery = z.infer<typeof TrichBotListQuerySchema>;

export default {
    TrichBotCreateSchema,
    TrichBotUpdateSchema,
    TrichBotListQuerySchema,
};
