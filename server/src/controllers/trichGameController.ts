// server/src/controllers/trichGameController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, gameService } from "../services";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas";


/**-----------------------------------------------------------------------------------------------------------
🎮 Create a new TrichGame session
This endpoint allows a user to create a new game session by providing necessary details in the request body.
--------------------------------------------------------------------------------------------------------------**/
export const createSession = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from authenticated request
    const userId = req.auth?.userId!;
    // Validate and parse request body
    const data = GameSessionCreateDTO.parse(req.body);

    // Create a new game session
    const session = await gameService.createSession(userId, data);

    // Log the creation of the new session
    await loggerService.logInfo("🎮 Game session created", {
        userId,
        sessionId: session._id,
        mode: session.mode,
        score: session.score,
    });

    // Respond with the created session
    res.status(201).json({ ok: true, session });
});

/**----------------------------------------------------------------------------------------------------------------------------------------
📋 Retrieve all TrichGame sessions for a user
This endpoint fetches all game sessions associated with the authenticated user, with optional query parameters for filtering and sorting.
-------------------------------------------------------------------------------------------------------------------------------------------**/
export const listSessions = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from authenticated request
    const userId = req.auth?.userId!;
    // Validate and parse query parameters
    const query = GameSessionListQuery.parse(req.query);

    // Fetch game sessions for the user based on query parameters
    const sessions = await gameService.listSessions(userId, query);

    // Log the retrieval of sessions
    await loggerService.logInfo("📜 Game sessions fetched", {
        userId,
        count: sessions.length,
        sort: query.sort,
    });

    // Respond with the list of sessions
    res.status(200).json({ ok: true, count: sessions.length, sessions });
});

/**--------------------------------------------------------------------------------------
🔁 Update an existing TrichGame session
This endpoint allows updating details of an existing game session identified by its ID.
-----------------------------------------------------------------------------------------**/
export const updateSession = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from authenticated request
    const { id } = req.params;
    // Validate and parse request body
    const data = GameSessionUpdateDTO.parse(req.body);

    // Update the game session
    const updated = await gameService.updateSession(id, data);

    // If session not found, log and respond with 404
    if (!updated) {
        await loggerService.log("⚠️ Game session not found", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Session not found" });
    }

    // Log the update of the session
    await loggerService.logInfo("✅ Game session updated", {
        id,
        updatedFields: Object.keys(data),
    });

    // Respond with the updated session
    res.status(200).json({ ok: true, updated });
});
