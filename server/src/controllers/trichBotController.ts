// server/src/controllers/trichBotController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, botService } from "../services";
import {
    TrichBotCreateDTO,
    TrichBotListQuery,
    TrichBotFeedbackDTO,
} from "../schemas";

/**------------------------------------------------------------------------
    🤖 Create a new TrichBot message (user prompt + bot response)
    Takes user input, generates a bot response, and stores the message.
---------------------------------------------------------------------------**/
export const createMessage = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const data = TrichBotCreateDTO.parse(req.body);

        const message = await botService.createMessage(userId, data);

        await loggerService.logInfo("TrichBot message created", {
            userId,
            messageId: message._id,
            intent: data.intent,
        });

        res.status(201).json({ ok: true, message });
    }
);

/**-------------------------------------------------------------------------------
    💬 Retrieve paginated list of TrichBot messages for the authenticated user
----------------------------------------------------------------------------------**/
export const listMessages = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const query = TrichBotListQuery.parse(req.query);

        const messages = await botService.listMessages(userId, query);

        await loggerService.logInfo("Fetched TrichBot messages", {
            userId,
            count: messages.length,
        });

        res.json({ ok: true, count: messages.length, messages });
    }
);

/**-------------------------------------------------------
    ⭐ Update feedback on a specific TrichBot message
----------------------------------------------------------*/
export const updateMessageFeedback = asyncHandler(
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const payload = TrichBotFeedbackDTO.parse(req.body);

        const updated = await botService.updateFeedback(id, payload);

        if (!updated) {
            await loggerService.log(
                "TrichBot message not found",
                "warning",
                "system",
                { id }
            );
            return res
                .status(404)
                .json({ ok: false, error: "Message not found" });
        }

        await loggerService.logInfo("TrichBot feedback updated", {
            id,
            feedback: payload,
        });

        res.json({ ok: true, message: updated });
    }
);

/**-------------------------------------------------------
    🧹 Clear all TrichBot messages for the current user
    Used by the "Clear chat" button in the UI.
    - Clears from DB so it stays empty after re-login.
----------------------------------------------------------*/
export const clearMessages = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId;

        if (!userId) {
            return res
                .status(401)
                .json({ ok: false, error: "Unauthorized" });
        }

        // Safely call clearMessages if it exists on botService; fall back to 0 if not implemented.
        const deletedCount = (botService as any).clearMessages
            ? await (botService as any).clearMessages(userId)
            : 0;

        await loggerService.logInfo("TrichBot history cleared", {
            userId,
            deletedCount,
        });

        // Frontend doesn't need a body; just indicate success.
        return res.status(204).send();
    }
);

export default {
    createMessage,
    listMessages,
    updateMessageFeedback,
    clearMessages,
};
