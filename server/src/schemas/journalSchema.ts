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
    sad: z.coerce.number().min(0).max(10).optional(),
    anxious: z.coerce.number().min(0).max(10).optional(),
    stressed: z.coerce.number().min(0).max(10).optional(),
    overwhelmed: z.coerce.number().min(0).max(10).optional(),
    angry: z.coerce.number().min(0).max(10).optional(),
    neutral: z.coerce.number().min(0).max(10).optional(),
    calm: z.coerce.number().min(0).max(10).optional(),
    tired: z.coerce.number().min(0).max(10).optional(),
    hopeful: z.coerce.number().min(0).max(10).optional(),
    happy: z.coerce.number().min(0).max(10).optional(),
    excited: z.coerce.number().min(0).max(10).optional(),
    focused: z.coerce.number().min(0).max(10).optional(),
    motivated: z.coerce.number().min(0).max(10).optional(),
    proud: z.coerce.number().min(0).max(10).optional(),
    urgeIntensity: z.coerce.number().min(0).max(10).optional(),
});
// Type for creating journal entries
export type JournalCreate = z.infer<typeof JournalCreateSchema>;
// DTO type for creating journal entries
export type JournalCreateDTO = JournalCreate; // backwards compat

// Schema for updating journal entries (all fields optional)
export const JournalUpdateSchema = JournalCreateSchema.partial();
// Type for updating journal entries
export type JournalUpdate = z.infer<typeof JournalUpdateSchema>;
// DTO type for updating journal entries
export type JournalUpdateDTO = JournalUpdate;

// Schema for listing/querying journal entries
export const JournalListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for future admin contexts
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
// Type for listing journal entries
export type JournalListQuery = z.infer<typeof JournalListQuerySchema>;

export default {
    JournalCreateSchema,
    JournalUpdateSchema,
    JournalListQuerySchema,
};
