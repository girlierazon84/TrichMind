// server/src/services/trichGameService.ts

import { GameSession } from "../models";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas";
import { loggerService } from "./loggerService";


/**--------------------------------------------------
🎮 TrichGame Service
Handles game session creation, listing, and updates.
-----------------------------------------------------**/
export const gameService = {
    // ➕ Create a new game session
    async createSession(userId: string, data: GameSessionCreateDTO) {
        try {
            // Create and save the new game session
            const session = await GameSession.create({ ...data, userId });
            // Log the creation event
            await loggerService.logInfo("Game session created", {
                userId,
                sessionId: session._id,
                mode: session.mode,
            });
            return session;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to create game session", {
                userId,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to create game session");
        }
    },

    // 📋 List all game sessions for a user (paginated)
    async listSessions(userId: string, query: GameSessionListQuery) {
        try {
            // Calculate pagination parameters
            const skip = (query.page - 1) * query.limit;
            // Fetch sessions from the database
            const sessions = await GameSession.find({ userId })
                .sort(query.sort)
                .skip(skip)
                .limit(query.limit);

            // Log the fetched sessions
            await loggerService.logInfo("Fetched game sessions", {
                userId,
                count: sessions.length,
                sort: query.sort,
            });

            // Return the fetched sessions
            return sessions;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to list game sessions", {
                userId,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to list game sessions");
        }
    },

    // 🔁 Update an existing game session
    async updateSession(id: string, data: GameSessionUpdateDTO) {
        try {
            // Find and update the game session
            const updated = await GameSession.findByIdAndUpdate(id, data, { new: true });

            // Log the update event
            if (!updated) {
                // Log if the session was not found
                await loggerService.log("Game session not found", "warning", "system", { id });
                return null;
            }

            // Log the update event
            await loggerService.logInfo("Game session updated", {
                sessionId: id,
                updatedFields: Object.keys(data),
            });

            // Rethrow a generic error
            return updated;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to update game session", {
                sessionId: id,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to update game session");
        }
    },
};
