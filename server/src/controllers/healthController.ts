// server/src/controllers/healthController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
} from "../schemas/healthSchema";
import { healthService } from "../services/healthService";
import { loggerService } from "../services/loggerService";

/**-------------------------------------------------------------------------
🩺 Create a new health log
This endpoint allows authenticated users to create a new health log entry.
----------------------------------------------------------------------------**/
export const createHealthLog = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Validate and parse request body
    const body = HealthCreateSchema.parse(req.body);

    // Create health log entry
    const log = await healthService.createHealthLog(userId, body);

    // Log the creation event
    await loggerService.logInfo("Health log created", { userId, logId: log._id });
    res.status(201).json({ ok: true, log });
});

/**-------------------------------------------------------------------------
📋 Get recent health logs (pagination + filters)
This endpoint retrieves a list of health logs for the authenticated user,
supporting pagination and filtering based on query parameters.
----------------------------------------------------------------------------**/
export const listHealthLogs = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Validate and parse query parameters
    const query = HealthListQuerySchema.parse(req.query);

    // Fetch health logs from service
    const logs = await healthService.getHealthLogs(userId, query);

    // Log the retrieval event
    await loggerService.logInfo("Health logs fetched", {
        userId,
        count: logs.length,
        sort: query.sort,
    });

    // Return the logs in the response
    res.json({ ok: true, count: logs.length, logs });
});

/**-----------------------------------------------------------------------------------------
🔄 Update a health log
This endpoint allows authenticated users to update an existing health log entry by its ID.
--------------------------------------------------------------------------------------------**/
export const updateHealthLog = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Extract health log ID from URL parameters
    const { id } = req.params;
    // Validate and parse request body
    const data = HealthUpdateSchema.parse(req.body);

    // Update health log entry
    const updated = await healthService.updateHealthLog(id, data);
    // If no log was found to update, return 404
    if (!updated) {
        await loggerService.log("Health log not found for update", "warning", undefined, { userId, id });
        return res.status(404).json({ ok: false, error: "Health log not found" });
    }

    // Log the update event
    await loggerService.logInfo("Health log updated", { userId, id });
    res.json({ ok: true, updated });
});
