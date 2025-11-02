// server/src/schemas/trichBotSchema.ts

import { z } from "zod";

/**--------------------------------------------
🤖 TrichBot AI schema
Stores chat interactions, tips, and feedback.
-----------------------------------------------**/
export const TrichBotCreateDTO = z.object({
    userId: z.string().min(1),
    prompt: z.string().min(1),
    response: z.string().min(1),
    tips: z.array(z.string()).optional(),
    riskScore: z.number().min(0).max(1).optional(),
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
            rating: z.number().int().min(1).max(5).optional(),
            comment: z.string().optional(),
        })
        .optional(),
});
export type TrichBotCreateDTO = z.infer<typeof TrichBotCreateDTO>;

export const TrichBotUpdateDTO = TrichBotCreateDTO.partial();
export type TrichBotUpdateDTO = z.infer<typeof TrichBotUpdateDTO>;

export const TrichBotListQuery = z.object({
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type TrichBotListQuery = z.infer<typeof TrichBotListQuery>;
