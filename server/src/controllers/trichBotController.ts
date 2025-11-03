// server/src/controllers/trichBotController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { botService } from "../services/trichBotService";
import { TrichBotCreateDTO, TrichBotListQuery } from "../schemas/trichBotSchema";
import { loggerService } from "../services/loggerService";

/**------------------------------------------------------------------
🤖 Create a new TrichBot message (user prompt + bot response)
Takes user input, generates a bot response, and stores the message.
---------------------------------------------------------------------**/
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth and parse request body
    const userId = req.auth?.userId!;
    // Validate and parse the incoming data
    const data = TrichBotCreateDTO.parse({ ...req.body, userId });

    // Delegate message creation to the bot service
    const message = await botService.createMessage(userId, data);

    // Log the creation of the new message
    await loggerService.logInfo("TrichBot message created", {
        userId,
        messageId: message._id,
    });

    // Respond with the created message
    res.status(201).json({ ok: true, message });
});

/**-------------------------------------------------------------------------
💬 Retrieve paginated list of TrichBot messages for the authenticated user
----------------------------------------------------------------------------**/
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth and parse query parameters
    const userId = req.auth?.userId!;
    // Validate and parse the query parameters
    const query = TrichBotListQuery.parse(req.query);

    // Delegate fetching messages to the bot service
    const messages = await botService.listMessages(userId, query);

    // Log the retrieval of messages
    await loggerService.logInfo("Fetched TrichBot messages", {
        userId,
        count: messages.length,
    });

    // Respond with the list of messages
    res.json({ ok: true, count: messages.length, messages });
});
