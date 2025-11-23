// server/src/schemas/trichBotSchema.ts

import { z } from "zod";

/**------------------------------------------------------
    🤖 TrichBot AI schema
    Client sends ONLY prompt (+ optional intent).
    Server fills response, tips, modelInfo, feedback.
---------------------------------------------------------**/

// Payload from client when asking the bot
export const TrichBotCreateDTO = z.object({
    prompt: z.string().min(1, "Prompt is required"),
    intent: z.string().optional(),
});
export type TrichBotCreateDTO = z.infer<typeof TrichBotCreateDTO>;

// Query params for listing messages
export const TrichBotListQuery = z.object({
    userId: z.string().optional(), // for future admin use
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type TrichBotListQuery = z.infer<typeof TrichBotListQuery>;

// Feedback payload for /:id/feedback
export const TrichBotFeedbackDTO = z
    .object({
        helpful: z.boolean().optional(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().optional(),
    })
    .refine(
        (v) => v.helpful !== undefined || v.rating !== undefined || !!v.comment?.trim(),
        { message: "At least one feedback field is required" }
    );
export type TrichBotFeedbackDTO = z.infer<typeof TrichBotFeedbackDTO>;

export default {
    TrichBotCreateDTO,
    TrichBotListQuery,
    TrichBotFeedbackDTO,
};
