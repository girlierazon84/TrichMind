// server/src/schemas/journalSchema.ts

import { z } from "zod";


// Pre-urge moods
export const PRE_URGE_MOODS = [
    "Sad",
    "Anxious",
    "Stressed",
    "Overwhelmed",
    "Angry",
    "Neutral",
    "Calm",
    "Tired",
    "Hopeful",
    "Happy",
    "Proud",
    "Bored",
] as const;

// Type for mood names
export type MoodName = (typeof PRE_URGE_MOODS)[number];

// Schema for creating a journal entry
export const JournalCreateSchema = z
    .object({
        prompt: z.string().trim().optional(),
        text: z.string().trim().default(""),

        mood: z.enum(PRE_URGE_MOODS).optional(),

        stress: z.coerce.number().min(0).max(10).optional(),
        calm: z.coerce.number().min(0).max(10).optional(),
        happy: z.coerce.number().min(0).max(10).optional(),

        urgeIntensity: z.coerce.number().min(0).max(10).optional(),

        preUrgeTriggers: z.array(z.string().trim().min(1)).optional(),
        preUrgeTriggerNotes: z.string().trim().max(1000).optional(),
    })
    .strict();

// Type for creating a journal entry
export type JournalCreateDTO = z.infer<typeof JournalCreateSchema>;

// Schema for updating a journal entry
export const JournalUpdateSchema = JournalCreateSchema.partial().strict();
export type JournalUpdateDTO = z.infer<typeof JournalUpdateSchema>;

// Schema for listing journal entries with query parameters
export const JournalListQuerySchema = z
    .object({
        userId: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.string().default("-createdAt"),
    })
    .strict();

// Type for listing journal entries with query parameters
export type JournalListQueryDTO = z.infer<typeof JournalListQuerySchema>;

export default {
    JournalCreateSchema,
    JournalUpdateSchema,
    JournalListQuerySchema,
};
