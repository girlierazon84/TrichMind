// server/src/controllers/healthController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import type {
    HealthCreate,
    HealthUpdate,
    HealthListQuery,
} from "../schemas";
import { loggerService, healthService } from "../services";

/**-------------------------------
    🩺 Create a new health log
----------------------------------**/
export const createHealthLog = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const body = req.body as HealthCreate; // already validated

        const log = await healthService.createHealthLog(userId, body);

        await loggerService.logInfo("Health log created", {
            userId,
            logId: log._id,
        });
        res.status(201).json({ ok: true, log });
    }
);

/**-----------------------------------------------------
    📋 Get recent health logs (pagination + filters)
--------------------------------------------------------**/
export const listHealthLogs = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const query = req.query as unknown as HealthListQuery;

        const logs = await healthService.getHealthLogs(userId, query);

        await loggerService.logInfo("Health logs fetched", {
            userId,
            count: logs.length,
            sort: query.sort,
        });

        res.json({ ok: true, count: logs.length, logs });
    }
);

/**---------------------------
    🔄 Update a health log
------------------------------**/
export const updateHealthLog = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const { id } = req.params;
        const data = req.body as HealthUpdate;

        const updated = await healthService.updateHealthLog(id, data);
        if (!updated) {
            await loggerService.log(
                "Health log not found for update",
                "warning",
                undefined,
                { userId, id }
            );
            return res
                .status(404)
                .json({ ok: false, error: "Health log not found" });
        }

        await loggerService.logInfo("Health log updated", { userId, id });
        res.json({ ok: true, updated });
    }
);

export default {
    createHealthLog,
    listHealthLogs,
    updateHealthLog,
};
