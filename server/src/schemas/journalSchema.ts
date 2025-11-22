// server/src/schemas/journalSchema.ts

import { z } from "zod";

/**--------------------------------------------
    📝 Journal schema
    Used for emotional & reflective entries.
-----------------------------------------------**/
export const JournalCreateSchema = z.object({
    prompt: z.string().trim().optional(),
    text: z.string().trim().default(""),
    mood: z.string().trim().optional(),
    stress: z.coerce.number().min(0).max(10).optional(),
    calm: z.coerce.number().min(0).max(10).optional(),
    happy: z.coerce.number().min(0).max(10).optional(),
    urgeIntensity: z.coerce.number().min(0).max(10).optional(),
});
export type JournalCreate = z.infer<typeof JournalCreateSchema>;
export type JournalCreateDTO = JournalCreate; // backwards compat

export const JournalUpdateSchema = JournalCreateSchema.partial();
export type JournalUpdate = z.infer<typeof JournalUpdateSchema>;
export type JournalUpdateDTO = JournalUpdate;

export const JournalListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for future admin contexts
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type JournalListQuery = z.infer<typeof JournalListQuerySchema>;
