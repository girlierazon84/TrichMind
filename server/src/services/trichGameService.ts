// server/src/services/trichGameService.ts

import { GameSession } from "../models/TrichGame";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas/trichGameSchema";
import { loggerService } from "./loggerService";

/**
 * 🎮 TrichGame Service
 * Handles game session creation, listing, and updates.
 */
export const gameService = {
    /**
     * ➕ Create a new game session
     */
    async createSession(userId: string, data: GameSessionCreateDTO) {
        try {
            const session = await GameSession.create({ ...data, userId });
            await loggerService.logInfo("Game session created", {
                userId,
                sessionId: session._id,
                mode: session.mode,
            });
            return session;
        } catch (err: any) {
            await loggerService.logError("Failed to create game session", {
                userId,
                error: err.message,
            });
            throw new Error("Failed to create game session");
        }
    },

    /**
     * 📋 List all game sessions for a user (paginated)
     */
    async listSessions(userId: string, query: GameSessionListQuery) {
        try {
            const skip = (query.page - 1) * query.limit;
            const sessions = await GameSession.find({ userId })
                .sort(query.sort)
                .skip(skip)
                .limit(query.limit);

            await loggerService.logInfo("Fetched game sessions", {
                userId,
                count: sessions.length,
                sort: query.sort,
            });

            return sessions;
        } catch (err: any) {
            await loggerService.logError("Failed to list game sessions", {
                userId,
                error: err.message,
            });
            throw new Error("Failed to list game sessions");
        }
    },

    /**
     * 🔁 Update an existing game session
     */
    async updateSession(id: string, data: GameSessionUpdateDTO) {
        try {
            const updated = await GameSession.findByIdAndUpdate(id, data, { new: true });

            if (!updated) {
                await loggerService.log("Game session not found", "warning", "system", { id });
                return null;
            }

            await loggerService.logInfo("Game session updated", {
                sessionId: id,
                updatedFields: Object.keys(data),
            });

            return updated;
        } catch (err: any) {
            await loggerService.logError("Failed to update game session", {
                sessionId: id,
                error: err.message,
            });
            throw new Error("Failed to update game session");
        }
    },
};
