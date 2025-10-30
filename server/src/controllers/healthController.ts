// server/src/controllers/healthController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HealthCreateSchema, HealthUpdateSchema, HealthListQuerySchema } from "../schemas/healthSchema";
import { healthService } from "../services/healthService";
import { loggerService } from "../services/loggerService";

/**
 * 🩺 Create a new health log and request ML relapse-risk prediction
 */
export const createHealthLog = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const body = HealthCreateSchema.parse(req.body);

    // 1️⃣ Create health log
    const log = await healthService.createHealthLog(userId, body);

    // 2️⃣ Attempt ML prediction enrichment
    try {
        const enriched = await healthService.enrichWithPrediction(log);
        await loggerService.logInfo("Health log created & enriched", {
            userId,
            logId: log._id,
            riskScore: enriched?.relapseRisk?.score,
        });

        return res.status(201).json({ ok: true, log: enriched });
    } catch (err: any) {
        await loggerService.log(
            "Health log created (ML failed)",
            "warning",
            "ml",
            {
                userId,
                error: err.message,
            },
            userId
        );

        return res.status(201).json({
            ok: true,
            log,
            warning: "Health log created, but ML enrichment failed",
        });
    }
});

/**
 * 📋 Get recent health logs (with pagination and sorting)
 */
export const listHealthLogs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = HealthListQuerySchema.parse(req.query);

    const logs = await healthService.getHealthLogs(userId, query);

    await loggerService.logInfo("Health logs fetched", {
        userId,
        count: logs.length,
        sort: query.sort,
    });

    res.json({ ok: true, count: logs.length, logs });
});

/**
 * 🔄 Update an existing health log
    if (!updated) {
        await loggerService.log(
            "Health log not found for update",
            "warning",
            "system",
            { id }
        );
        return res.status(404).json({ ok: false, error: "Health log not found" });
    }

    const updated = await healthService.updateHealthLog(id, data);
    if (!updated) {
        await loggerService.logWarn("Health log not found for update", { id });
        return res.status(404).json({ ok: false, error: "Health log not found" });
    }

    await loggerService.logInfo("Health log updated", { id });
    res.json({ ok: true, updated });
 **/
