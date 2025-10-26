// server/src/controllers/predictController.ts
import { Request, Response } from "express";
import axios from "axios";
import Predict from "../models/Predict";
import { PredictDTO } from "../schemas/predictSchema";
import { asyncHandler } from "../utils/asyncHandler";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Sends prediction request to FastAPI ML model and stores response.
 */
export const predictRelapseRisk = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const input = PredictDTO.parse(req.body);

    try {
        const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, input);
        const { risk_score, risk_bucket, confidence, model_version } = data;

        const saved = await Predict.create({
            userId,
            ...input,
            risk_score,
            risk_bucket,
            confidence,
            model_version,
            served_by: "FastAPI",
        });

        logger.info(`🧠 Prediction logged for user ${userId}`);
        res.status(201).json({ ok: true, prediction: saved });
    } catch (err: any) {
        logger.error(`❌ Prediction error: ${err.message}`);
        res.status(502).json({ error: "Prediction service unavailable" });
    }
});
