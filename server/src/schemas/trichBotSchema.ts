// server/src/schemas/trichBotSchema.ts

import { z } from "zod";


// Schema for creating a TrichBot message
export const TrichBotCreateSchema = z
    .object({
        prompt: z.string().min(1, "Prompt is required"),
        intent: z.string().trim().optional(),
    })
    .strict();

// Type TrichBotCreateDTO
export type TrichBotCreateDTO = z.infer<typeof TrichBotCreateSchema>;

// List query
export const TrichBotListQuerySchema = z
    .object({
        userId: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.string().default("-createdAt"),
    })
    .strict();

// Type TrichBotListQueryDTO
export type TrichBotListQueryDTO = z.infer<typeof TrichBotListQuerySchema>;

// Feedback
export const TrichBotFeedbackSchema = z
    .object({
        helpful: z.boolean().optional(),
        rating: z.coerce.number().int().min(1).max(5).optional(),
        comment: z.string().trim().optional(),
    })
    .refine((v) => v.helpful !== undefined || v.rating !== undefined || !!v.comment, {
        message: "At least one feedback field is required",
    })
    .strict();

// Type TrichBotFeedbackDTO
export type TrichBotFeedbackDTO = z.infer<typeof TrichBotFeedbackSchema>;

// Export all schemas
export default {
    TrichBotCreateSchema,
    TrichBotListQuerySchema,
    TrichBotFeedbackSchema,
};
