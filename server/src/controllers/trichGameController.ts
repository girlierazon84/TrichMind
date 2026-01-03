// server/src/controllers/trichGameController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import {
    loggerService,
    trichGameService
} from "../services";
import type {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQueryDTO,
} from "../schemas";


/**---------------------------------------------------
    Auth guard (fixes req.auth possibly undefined)
------------------------------------------------------*/
function hasAuth(
    req: Request
): req is Request & { auth: { userId: string; token?: string } } {
    return Boolean(req.auth?.userId);
}

// fire-and-forget logger
type GameCategory = Parameters<typeof loggerService.logInfo>[2];

// Safe logging functions that never throw
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: GameCategory = "game"
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch {
        // never throw
    }
}

// Safe logging functions that never throw
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: GameCategory = "game"
) {
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch {
        // never throw
    }
}

/**---------------------------------------
    🎮 Create a new TrichGame session
------------------------------------------**/
export const createSession = asyncHandler(async (req: Request, res: Response) => {
    // Auth check
    if (!hasAuth(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    // Get user ID from auth
    const userId = req.auth.userId;

    // Get data from body
    const data = req.body as GameSessionCreateDTO;
    const session = await trichGameService.createSession(userId, data);

    // Log the creation
    safeLogInfo(
        "Game session created",
        { userId, sessionId: (session as any)?._id },
        userId,
        "game"
    );

    // Return the created session
    return res.status(201).json({ ok: true, session });
});

/**--------------------------------
    📋 List TrichGame sessions
-----------------------------------*/
export const listSessions = asyncHandler(async (req: Request, res: Response) => {
    // Auth check
    if (!hasAuth(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    // Get user ID from auth
    const userId = req.auth.userId;

    // Get query params
    const query = req.query as unknown as GameSessionListQueryDTO;
    const sessions = await trichGameService.listSessions(userId, query);

    // Log the listing
    safeLogInfo(
        "Game sessions fetched",
        { userId, count: sessions.length, sort: (query as any).sort },
        userId,
        "game"
    );

    // Return the sessions
    return res.status(200).json({ ok: true, count: sessions.length, sessions });
});

/**-----------------------------------
    🔁 Update a TrichGame session
--------------------------------------*/
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
    // Auth check
    if (!hasAuth(req)) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    // Get user ID from auth
    const userId = req.auth.userId;

    // Get session ID from params and data from body
    const { id } = req.params;
    const data = req.body as GameSessionUpdateDTO;

    // Update the session
    const updated = await trichGameService.updateSession(id, data);

    // If not found, return 404
    if (!updated) {
        safeLogWarn("Game session not found", { userId, id }, userId, "game");
        return res
            .status(404)
            .json({ ok: false, error: "NotFound", message: "Session not found" });
    }

    // Log the update
    safeLogInfo(
        "Game session updated",
        { userId, id, updatedFields: Object.keys(data || {}) },
        userId,
        "game"
    );

    // Return the updated session
    return res.status(200).json({ ok: true, updated });
});

export default {
    createSession,
    listSessions,
    updateSession,
};
