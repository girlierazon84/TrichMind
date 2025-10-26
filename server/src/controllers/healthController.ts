// server/src/controllers/healthController.ts
import { Request, Response } from "express";
import HealthLog from "../models/HealthLog";
import { HealthCreateSchema, HealthUpdateSchema, HealthListQuerySchema } from "../schemas/healthSchema";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";
import axios from "axios";
import { ENV } from "../config/env";

/**
 * Create a new health log and send to ML model for relapse prediction
 */
export const createHealthLog = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const body = HealthCreateSchema.parse(req.body);

    const log = await HealthLog.create({ userId, ...body });

    try {
        // Send data to FastAPI ML service for prediction
        const { data: prediction } = await axios.post(`${ENV.ML_BASE_URL}/predict`, {
            age: 30,
            pulling_severity: body.stressLevel,
            pulling_frequency_encoded: 1,
            awareness_level_encoded: 0.5,
            successfully_stopped_encoded: 0,
            how_long_stopped_days_est: 0,
            emotion: "neutral",
        });

        if (prediction?.risk_score) {
            log.relapseRisk = {
                score: prediction.risk_score,
                bucket: prediction.risk_bucket || "unknown",
                confidence: prediction.confidence || null,
            };
            await log.save();
        }
    } catch (err: any) {
        logger.warn(`⚠️ ML prediction failed: ${err.message}`);
    }

    res.status(201).json({ ok: true, log });
});

/**
 * Get recent logs
 */
export const listHealthLogs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = HealthListQuerySchema.parse(req.query);

    const skip = (query.page - 1) * query.limit;
    const logs = await HealthLog.find({ userId })
        .sort(query.sort.replace("-", "") as any)
        .skip(skip)
        .limit(query.limit);

    res.json({ ok: true, count: logs.length, logs });
});

/**
 * Update an existing log
 */
export const updateHealthLog = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = HealthUpdateSchema.parse(req.body);

    const updated = await HealthLog.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Health log not found" });

    res.json({ ok: true, updated });
});
