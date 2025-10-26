// server/src/schemas/trichGameSchema.ts
import { z } from "zod";

/**
 * 🎮 TrichGame session schema
 * Tracks relaxation or focus games for behavior redirection.
 */
export const GameSessionCreateDTO = z.object({
    userId: z.string().min(1),
    gameName: z.string().default("TrichGame"),
    mode: z.string().optional(), // e.g., "focus", "calming"
    score: z.number().min(0).default(0),
    streak: z.number().min(0).default(0),
    durationSeconds: z.number().min(0).default(0),
    startedAt: z.coerce.date().optional(),
    endedAt: z.coerce.date().optional(),
    completed: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type GameSessionCreateDTO = z.infer<typeof GameSessionCreateDTO>;

export const GameSessionUpdateDTO = GameSessionCreateDTO.partial();
export type GameSessionUpdateDTO = z.infer<typeof GameSessionUpdateDTO>;

export const GameSessionListQuery = z.object({
    userId: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type GameSessionListQuery = z.infer<typeof GameSessionListQuery>;
