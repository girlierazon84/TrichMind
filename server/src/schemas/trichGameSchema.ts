// server/src/schemas/trichGameSchema.ts

import { z } from "zod";

/**--------------------------------------------------------------
    🎮 TrichGame session schema
    Tracks relaxation or focus games for behavior redirection.
-----------------------------------------------------------------**/
export const GameSessionCreateSchema = z.object({
    gameName: z.string().default("TrichGame"),
    mode: z.string().optional(), // e.g., "focus", "calming"
    score: z.coerce.number().min(0).default(0),
    streak: z.coerce.number().min(0).default(0),
    durationSeconds: z.coerce.number().min(0).default(0),
    startedAt: z.coerce.date().optional(),
    endedAt: z.coerce.date().optional(),
    completed: z.boolean().default(false),
    metadata: z.record(z.string(), z.any()).optional(),
});
export type GameSessionCreate = z.infer<typeof GameSessionCreateSchema>;
export type GameSessionCreateDTO = GameSessionCreate;

export const GameSessionUpdateSchema = GameSessionCreateSchema.partial();
export type GameSessionUpdate = z.infer<typeof GameSessionUpdateSchema>;
export type GameSessionUpdateDTO = GameSessionUpdate;

export const GameSessionListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin contexts
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
export type GameSessionListQuery = z.infer<typeof GameSessionListQuerySchema>;
