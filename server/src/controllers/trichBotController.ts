// server/src/controllers/trichBotController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { botService } from "../services/trichBotService";
import { TrichBotCreateDTO, TrichBotListQuery } from "../schemas/trichBotSchema";
import { loggerService } from "../services/loggerService";

/**
 * 🤖 Create a new TrichBot message (user prompt + bot response)
 */
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = TrichBotCreateDTO.parse({ ...req.body, userId });

    const message = await botService.createMessage(userId, data);

    await loggerService.logInfo("TrichBot message created", {
        userId,
        messageId: message._id,
    });

    res.status(201).json({ ok: true, message });
});

/**
 * 💬 Retrieve paginated list of TrichBot messages for the authenticated user
 */
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = TrichBotListQuery.parse(req.query);

    const messages = await botService.listMessages(userId, query);

    await loggerService.logInfo("Fetched TrichBot messages", {
        userId,
        count: messages.length,
    });

    res.json({ ok: true, count: messages.length, messages });
});
