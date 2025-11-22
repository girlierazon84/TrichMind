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
export type TrichBotCreate = z.infer<typeof TrichBotCreateSchema>;
export type TrichBotCreateDTO = TrichBotCreate;

export const TrichBotUpdateSchema = TrichBotCreateSchema.partial();
export type TrichBotUpdate = z.infer<typeof TrichBotUpdateSchema>;
export type TrichBotUpdateDTO = TrichBotUpdate;

export const TrichBotListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin / support tooling
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type TrichBotListQuery = z.infer<typeof TrichBotListQuerySchema>;
