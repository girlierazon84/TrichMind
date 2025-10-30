// server/src/controllers/trichGameController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { gameService } from "../services/trichGameService";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas/trichGameSchema";
import { loggerService } from "../services/loggerService";

/**
 * 🎮 Create a new TrichGame session
 */
export const createSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = GameSessionCreateDTO.parse(req.body);

    const session = await gameService.createSession(userId, data);

    await loggerService.logInfo("🎮 Game session created", {
        userId,
        sessionId: session._id,
        mode: session.mode,
        score: session.score,
    });

    res.status(201).json({ ok: true, session });
});

/**
 * 📋 Retrieve all TrichGame sessions for a user
 */
export const listSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = GameSessionListQuery.parse(req.query);

    const sessions = await gameService.listSessions(userId, query);

    await loggerService.logInfo("📜 Game sessions fetched", {
        userId,
        count: sessions.length,
        sort: query.sort,
    });

    res.status(200).json({ ok: true, count: sessions.length, sessions });
});

/**
 * 🔁 Update an existing TrichGame session
 */
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = GameSessionUpdateDTO.parse(req.body);

    const updated = await gameService.updateSession(id, data);

    if (!updated) {
        await loggerService.log("⚠️ Game session not found", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Session not found" });
    }

    await loggerService.logInfo("✅ Game session updated", {
        id,
        updatedFields: Object.keys(data),
    });

    res.status(200).json({ ok: true, updated });
});
