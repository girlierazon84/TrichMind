// server/src/controllers/trichBotController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, botService } from "../services";
import type {
    TrichBotCreateDTO,
    TrichBotListQuery,
} from "../schemas";

/**--------------------------------------
    🤖 Create a new TrichBot message
-----------------------------------------**/
export const createMessage = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const data = req.body as TrichBotCreateDTO;

        const message = await botService.createMessage(userId, data);

        await loggerService.logInfo("TrichBot message created", {
            userId,
            messageId: message._id,
        });

        res.status(201).json({ ok: true, message });
    }
);

/**--------------------------------------------------------------------------------
    💬 Retrieve paginated list of TrichBot messages for the authenticated user
-----------------------------------------------------------------------------------**/
export const listMessages = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const query = req.query as unknown as TrichBotListQuery;

        const messages = await botService.listMessages(userId, query);

        await loggerService.logInfo("Fetched TrichBot messages", {
            userId,
            count: messages.length,
        });

        res.json({ ok: true, count: messages.length, messages });
    }
);

export default {
    createMessage,
    listMessages
};
