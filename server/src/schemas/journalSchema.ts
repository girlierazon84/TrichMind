// server/src/schemas/journalSchema.ts

import { z } from "zod";

/**--------------------------------------------
    📝 Journal schema
    Used for emotional & reflective entries.
    Focused on key pre-pulling moods.
-----------------------------------------------**/

// Canonical set of pre-urge moods for TrichMind
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

export type MoodName = (typeof PRE_URGE_MOODS)[number];

export const JournalCreateSchema = z.object({
    prompt: z.string().trim().optional(),
    text: z.string().trim().default(""),

    // categorical mood before/around pulling
    mood: z.enum(PRE_URGE_MOODS).optional(),

    // clustered mood intensities for ML (0–10)
    stress: z.coerce.number().min(0).max(10).optional(), // Sad / Anxious / Stressed / Overwhelmed / Angry / Bored
    calm: z.coerce.number().min(0).max(10).optional(),   // Calm / Neutral / Tired (low arousal)
    happy: z.coerce.number().min(0).max(10).optional(),  // Hopeful / Happy / Proud (positive)

    // overall urge intensity before/after pulling
    urgeIntensity: z.coerce.number().min(0).max(10).optional(),

    // 🔹 NEW: structured pre-urge triggers from JournalPage chips
    preUrgeTriggers: z
        .array(z.string().trim().min(1))
        .optional(),

    // 🔹 NEW: optional free-text notes about triggers
    preUrgeTriggerNotes: z
        .string()
        .trim()
        .max(1000)
        .optional(),
});

// Type for creating journal entries
export type JournalCreate = z.infer<typeof JournalCreateSchema>;
export type JournalCreateDTO = JournalCreate; // backwards compat

// Schema for updating journal entries (all fields optional)
export const JournalUpdateSchema = JournalCreateSchema.partial();
export type JournalUpdate = z.infer<typeof JournalUpdateSchema>;
export type JournalUpdateDTO = JournalUpdate;

// Schema for listing/querying journal entries
export const JournalListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for future admin contexts
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});

export type JournalListQuery = z.infer<typeof JournalListQuerySchema>;

export default {
    JournalCreateSchema,
    JournalUpdateSchema,
    JournalListQuerySchema,
};
