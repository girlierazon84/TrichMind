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
// DTO type for creating a GameSession entry
export type GameSessionCreate = z.infer<typeof GameSessionCreateSchema>;
// DTO type for creating a GameSession entry
export type GameSessionCreateDTO = GameSessionCreate;

// Schema for updating GameSession entries (all fields optional)
export const GameSessionUpdateSchema = GameSessionCreateSchema.partial();
// DTO type for updating a GameSession entry
export type GameSessionUpdate = z.infer<typeof GameSessionUpdateSchema>;
// DTO type for updating a GameSession entry
export type GameSessionUpdateDTO = GameSessionUpdate;

// Schema for querying GameSession entries with pagination and filtering
export const GameSessionListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin contexts
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().default("-createdAt"),
});
// DTO type for listing GameSession entries
export type GameSessionListQuery = z.infer<typeof GameSessionListQuerySchema>;

export default {
    GameSessionCreateSchema,
    GameSessionUpdateSchema,
    GameSessionListQuerySchema,
};
