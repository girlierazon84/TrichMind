// server/src/controllers/triggersInsightsController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";

// ✅ new structure: import services directly (not from "../services" barrel)
import { triggersInsightsService } from "../services/triggersInsightsService";
import { loggerService } from "../services/loggerService";

import type {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQueryDTO,
} from "../schemas";

import type { ILogEvent } from "../models";


/**-----------------------------------
    fire-and-forget logger helpers
--------------------------------------*/
type LogCategory = ILogEvent["category"];

// ✅ "triggers" is NOT a valid category in your LogModel.ts,
// so use "ui" (best fit) or "system".
const DEFAULT_CATEGORY: LogCategory = "ui";

/**-----------------------------------------------
    Small auth guard to keep controllers clean
--------------------------------------------------*/
// Returns userId or sends 401 response
function requireUserId(req: Request, res: Response): string | null {
    // Extract userId from auth (assuming auth middleware populates req.auth)
    const userId = req.auth?.userId;
    if (!userId) {
        res.status(401).json({ ok: false, error: "Unauthorized" });
        return null;
    }
    return userId;
}

// fire-and-forget logger
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: LogCategory = DEFAULT_CATEGORY
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch {
        // never throw
    }
}

// fire-and-forget logger
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: LogCategory = DEFAULT_CATEGORY
) {
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch {
        // never throw
    }
}

/**-------------------------------
    ➕ Create trigger insight
----------------------------------*/
export const createTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Validate and extract body
    const data = req.body as TriggersInsightsCreateDTO;
    const trigger = await triggersInsightsService.create(userId, data);

    // Log creation
    safeLogInfo(
        "Triggers & Insights created",
        { userId, triggerId: (trigger as any)?._id, name: (trigger as any)?.name },
        userId
    );

    // Respond with created trigger
    res.status(201).json({ ok: true, trigger });
});

/**----------------------------------------------------
    📋 List trigger insights (pagination + search)
-------------------------------------------------------*/
export const listTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Validate and extract query params
    const query = req.query as unknown as TriggersInsightsListQueryDTO;
    const triggers = await triggersInsightsService.list(userId, query);

    // Log listing
    safeLogInfo(
        "Fetched triggers & insights",
        { userId, count: triggers.length, search: (query as any).search },
        userId
    );

    // Respond with triggers
    res.status(200).json({ ok: true, count: triggers.length, triggers });
});

/**-------------------------------
    ✏️ Update trigger insight
----------------------------------*/
export const updateTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = requireUserId(req, res);
    if (!userId) return;

    // Validate and extract params and body
    const { id } = req.params;
    const data = req.body as TriggersInsightsUpdateDTO;

    // Attempt update
    const updated = await triggersInsightsService.update(id, data);
    if (!updated) {
        safeLogWarn("Trigger insight not found", { userId, id }, userId);

        // Respond with 404
        return res.status(404).json({
            ok: false,
            error: "NotFound",
            message: "Triggers & Insights not found",
        });
    }

    // Log update
    safeLogInfo("Triggers & Insights updated", { userId, id }, userId);

    // Respond with updated trigger
    res.status(200).json({ ok: true, updated });
});

export default {
    createTriggersInsights,
    listTriggersInsights,
    updateTriggersInsights,
};
