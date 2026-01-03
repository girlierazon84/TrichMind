// server/src/services/trichGameService.ts

import { GameSession } from "../models";
import type {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQueryDTO
} from "../schemas";
import { loggerService } from "./loggerService";


// Helper function to parse sort parameter
function parseSort(sort?: string) {
    // Default to sorting by createdAt descending
    const s = typeof sort === "string" && sort.trim().length ? sort.trim() : "-createdAt";
    const desc = s.startsWith("-");
    const field = desc ? s.slice(1) : s;
    return { [field]: desc ? -1 : 1 } as Record<string, 1 | -1>;
}

// Game service implementation
export const trichGameService = {
    // Create a new game session
    async createSession(userId: string, data: GameSessionCreateDTO) {
        // Create the game session in the database
        const session = await GameSession.create({ ...data, userId });

        // Log the creation event
        void loggerService.logInfo(
            "Game session created",
            { userId, sessionId: session._id, mode: session.mode, score: session.score },
            "system",
            userId
        );

        // Return the created session
        return session;
    },

    // List game sessions with pagination and sorting
    async listSessions(userId: string, query: GameSessionListQueryDTO) {
        // Calculate pagination parameters
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        // Fetch sessions from the database
        const sessions = await GameSession.find({ userId })
            .sort(parseSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        return sessions;
    },

    // Update an existing game session
    async updateSession(id: string, data: GameSessionUpdateDTO) {
        // Update the game session in the database
        const updated = await GameSession.findByIdAndUpdate(id, data, { new: true }).lean().exec();

        // If not found, log a warning and return null
        if (!updated) {
            // Log the warning
            void loggerService.logWarning("Game session not found", { id }, "system");
            return null;
        }

        // Log the update event
        void loggerService.logInfo(
            "Game session updated",
            { id, updatedFields: Object.keys(data) },
            "system"
        );

        // Return the updated session
        return updated;
    },
};

export default trichGameService;
