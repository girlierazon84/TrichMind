// server/src/controllers/trichBotController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, botService } from "../services";
import {
    TrichBotCreateSchema,
    TrichBotListQuerySchema,
    TrichBotFeedbackSchema,
} from "../schemas";


// fire-and-forget logger
type BotCategory = Parameters<typeof loggerService.logInfo>[2];

/**---------------------------------------------------------
    Safe logging functions to avoid disrupting main flow
------------------------------------------------------------*/

// Info log safe wrapper
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: BotCategory = "bot"
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch { }
}

// Warning log safe wrapper
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: BotCategory = "bot"
) {
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch { }
}

/**--------------------------------------
    🤖 Create a new TrichBot message
-----------------------------------------*/
export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    // Get user ID from auth middleware
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Validate request body
    const parsed = TrichBotCreateSchema.safeParse(req.body);
    // If validation fails, return 400 with details
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", details: parsed.error.flatten() });
    }

    // Create the TrichBot message
    const message = await botService.createMessage(userId, parsed.data);

    // Log creation event
    safeLogInfo("TrichBot message created", { userId, messageId: (message as any)?._id, intent: parsed.data.intent }, userId);
    res.status(201).json({ ok: true, message });
});

/**-------------------------------
    💬 List TrichBot messages
----------------------------------*/
export const listMessages = asyncHandler(async (req: Request, res: Response) => {
    // Get user ID from auth middleware
    const userId = req.auth?.userId;
    // If no user ID, return 401 Unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Validate query parameters
    const parsed = TrichBotListQuerySchema.safeParse(req.query);
    // If validation fails, return 400 with details
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", details: parsed.error.flatten() });
    }

    // Fetch messages from the service
    const messages = await botService.listMessages(userId, parsed.data as any);

    // Log listing event
    safeLogInfo("Fetched TrichBot messages", { userId, count: messages.length }, userId);
    res.json({ ok: true, count: messages.length, messages });
});

/**----------------------------------------------
    ⭐ Update feedback on a TrichBot message
-------------------------------------------------*/
export const updateMessageFeedback = asyncHandler(async (req: Request, res: Response) => {
    // Get user ID from auth middleware
    const userId = req.auth?.userId;
    // If no user ID, return 401 Unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Get message ID from URL parameters
    const { id } = req.params;

    // Validate request body
    const parsed = TrichBotFeedbackSchema.safeParse(req.body);
    // If validation fails, return 400 with details
    if (!parsed.success) {
        return res.status(400).json({ ok: false, error: "ValidationError", details: parsed.error.flatten() });
    }

    // Update feedback in the service
    const updated = await botService.updateFeedback(id, parsed.data);
    // If message not found, return 404
    if (!updated) {
        safeLogWarn("TrichBot message not found", { userId, id }, userId);
        return res.status(404).json({ ok: false, error: "NotFound", message: "Message not found" });
    }

    // Log feedback update event
    safeLogInfo("TrichBot feedback updated", { userId, id }, userId);
    res.json({ ok: true, message: updated });
});

/**---------------------------------------------
    🧹 Clear all TrichBot messages for user
------------------------------------------------*/
export const clearMessages = asyncHandler(async (req: Request, res: Response) => {
    // Get user ID from auth middleware
    const userId = req.auth?.userId;
    // If no user ID, return 401 Unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Clear messages in the service
    const deletedCount = await botService.clearMessages(userId);

    // Log clearing event
    safeLogInfo("TrichBot history cleared", { userId, deletedCount }, userId);
    return res.status(204).send();
});

export default {
    createMessage,
    listMessages,
    updateMessageFeedback,
    clearMessages,
};
