// server/src/schemas/journalSchema.ts
import { z } from "zod";

/**
 * 📝 Journal schema
 * Used for emotional & reflective entries.
 */
export const JournalCreateDTO = z.object({
    userId: z.string().min(1),
    prompt: z.string().trim().optional(),
    text: z.string().trim().default(""),
    mood: z.string().trim().optional(),
    stress: z.number().min(0).max(10).optional(),
    calm: z.number().min(0).max(10).optional(),
    happy: z.number().min(0).max(10).optional(),
    urgeIntensity: z.number().min(0).max(10).optional(),
});
export type JournalCreateDTO = z.infer<typeof JournalCreateDTO>;

export const JournalUpdateDTO = JournalCreateDTO.partial();
export type JournalUpdateDTO = z.infer<typeof JournalUpdateDTO>;

export const JournalListQuery = z.object({
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type JournalListQuery = z.infer<typeof JournalListQuery>;
