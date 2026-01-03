// server/src/schemas/trichGameSchema.ts

import { z } from "zod";


// Schema for creating a new game session
export const GameSessionCreateSchema = z
    .object({
        gameName: z.string().default("TrichGame"),
        mode: z.string().trim().optional(), // e.g. "focus", "calming"
        score: z.coerce.number().min(0).default(0),
        streak: z.coerce.number().min(0).default(0),
        durationSeconds: z.coerce.number().min(0).default(0),

        startedAt: z.coerce.date().optional(),
        endedAt: z.coerce.date().optional(),
        completed: z.boolean().default(false),

        // More permissive metadata
        metadata: z.record(z.string(), z.any()).optional(),
    })
    .strict();

// TypeScript type for the create DTO
export type GameSessionCreateDTO = z.infer<typeof GameSessionCreateSchema>;

// Schema for updating an existing game session
export const GameSessionUpdateSchema =
    GameSessionCreateSchema.partial().strict();

// TypeScript type for the update DTO
export type GameSessionUpdateDTO = z.infer<typeof GameSessionUpdateSchema>;

// Schema for listing game sessions with query parameters
export const GameSessionListQuerySchema = z
    .object({
        userId: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sort: z.string().default("-createdAt"),
    })
    .strict();

// TypeScript type for the list query DTO
export type GameSessionListQueryDTO = z.infer<typeof GameSessionListQuerySchema>;

export default {
    GameSessionCreateSchema,
    GameSessionUpdateSchema,
    GameSessionListQuerySchema,
};
