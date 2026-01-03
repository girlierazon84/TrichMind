// server/src/controllers/healthController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import type {
    HealthCreateDTO,
    HealthUpdateDTO,
    HealthListQueryDTO
} from "../schemas";
import {
    loggerService,
    healthService
} from "../services";


// fire-and-forget logger
type HealthCategory = Parameters<typeof loggerService.logInfo>[2];

/**-----------------------------------------------------------
    🛡️ Safe logging functions - Log info without throwing
--------------------------------------------------------------*/
// Log info safely without throwing
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: HealthCategory = "health"
) {
    // Try to log info, ignore errors
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch { }
}

// Log warning safely without throwing
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: HealthCategory = "health"
) {
    // Try to log warning, ignore errors
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch { }
}

/**--------------------------------
    🩺 Create a new health log
-----------------------------------*/
export const createHealthLog = asyncHandler(async (req: Request, res: Response) => {
    // Authenticate user
    const userId = req.auth?.userId;
    // If no userId, return unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Parse request body
    const body = req.body as HealthCreateDTO;
    const log = await healthService.createHealthLog(userId, body);

    // Safe log creation info
    safeLogInfo("Health log created", { userId, logId: (log as any)?._id }, userId);
    res.status(201).json({ ok: true, log });
});

/**----------------------------------------------
    📋 Get health logs (pagination + filters)
-------------------------------------------------*/
export const listHealthLogs = asyncHandler(async (req: Request, res: Response) => {
    // Authenticate user
    const userId = req.auth?.userId;
    // If no userId, return unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Parse query parameters
    const query = req.query as unknown as HealthListQueryDTO;
    const logs = await healthService.getHealthLogs(userId, query);

    // Safe log fetching info
    safeLogInfo("Health logs fetched", { userId, count: logs.length, sort: (query as any).sort }, userId);
    res.json({ ok: true, count: logs.length, logs });
});

/**----------------------------
    🔄 Update a health log
-------------------------------*/
export const updateHealthLog = asyncHandler(async (req: Request, res: Response) => {
    // Authenticate user
    const userId = req.auth?.userId;
    // If no userId, return unauthorized
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Parse parameters and body
    const { id } = req.params;
    const data = req.body as HealthUpdateDTO;

    // Update health log
    const updated = await healthService.updateHealthLog(id, data);
    // If not found, log warning and return 404
    if (!updated) {
        safeLogWarn("Health log not found for update", { userId, id }, userId);
        return res.status(404).json({ ok: false, error: "NotFound", message: "Health log not found" });
    }

    // Safe log update info
    safeLogInfo("Health log updated", { userId, id }, userId);
    res.json({ ok: true, updated });
});

export default {
    createHealthLog,
    listHealthLogs,
    updateHealthLog,
};
