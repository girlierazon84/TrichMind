// server/src/controllers/trichGameController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, gameService } from "../services";
import type {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas";

/**---------------------------------------
    🎮 Create a new TrichGame session
------------------------------------------**/
export const createSession = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const data = req.body as GameSessionCreateDTO;

        const session = await gameService.createSession(userId, data);

        await loggerService.logInfo("🎮 Game session created", {
            userId,
            sessionId: session._id,
            mode: session.mode,
            score: session.score,
        });

        res.status(201).json({ ok: true, session });
    }
);

/**---------------------------------------------------
    📋 Retrieve all TrichGame sessions for a user
------------------------------------------------------**/
export const listSessions = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const query = req.query as unknown as GameSessionListQuery;

        const sessions = await gameService.listSessions(userId, query);

        await loggerService.logInfo("📜 Game sessions fetched", {
            userId,
            count: sessions.length,
            sort: query.sort,
        });

        res.status(200).json({ ok: true, count: sessions.length, sessions });
    }
);

/**---------------------------------------------
    🔁 Update an existing TrichGame session
------------------------------------------------**/
export const updateSession = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const data = req.body as GameSessionUpdateDTO;

        const updated = await gameService.updateSession(id, data);

        if (!updated) {
            await loggerService.log(
                "⚠️ Game session not found",
                "warning",
                "system",
                { id }
            );
            return res
                .status(404)
                .json({ ok: false, error: "Session not found" });
        }

        await loggerService.logInfo("✅ Game session updated", {
            id,
            updatedFields: Object.keys(data),
        });

        res.status(200).json({ ok: true, updated });
    }
);

export default {
    createSession,
    listSessions,
    updateSession,
};
