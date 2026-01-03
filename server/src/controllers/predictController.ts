// server/src/controllers/predictController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import {
    PredictSchema,
    PredictRelapseOverviewSchema,
    type PredictDTO,
    type PredictRelapseOverviewDTO,
} from "../schemas";
import { loggerService, predictService } from "../services";


// fire-and-forget logger
type MlCategory = Parameters<typeof loggerService.logInfo>[2];

/**---------------------------------------------------------------
    Safely logs informational messages without throwing errors
    even if the logging service fails.
------------------------------------------------------------------*/
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: MlCategory = "ml"
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch { }
}
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: MlCategory = "ml"
) {
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch { }
}
function safeLogError(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: MlCategory = "ml"
) {
    try {
        void loggerService.logError(message, context, category, userId);
    } catch { }
}

/**---------------------------------------------
    🧠 Predict relapse risk (friendly/core)
------------------------------------------------*/
export const predictRelapseRisk = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Validate input
    const parsed = PredictSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "ValidationError",
            message: "Invalid prediction payload",
            details: parsed.error.flatten(),
        });
    }

    // Proceed with prediction
    const input = parsed.data as PredictDTO;

    // Log initiation
    safeLogInfo("Prediction request initiated", { userId, emotion: input.emotion }, userId);

    // Call prediction service
    try {
        const prediction = await predictService.predict(userId, input);

        // Log success
        safeLogInfo(
            "Prediction completed",
            { userId, risk_score: (prediction as any).risk_score, bucket: (prediction as any).risk_bucket },
            userId
        );

        // Respond with prediction
        res.status(201).json({ ok: true, prediction });
    } catch (err: any) {
        safeLogError("Prediction service failed", { userId, error: err?.message ?? String(err) }, userId);

        // Respond with error
        res.status(502).json({
            ok: false,
            error: "PredictionServiceUnavailable",
            message: "Prediction service unavailable",
            details: err?.message ?? String(err),
        });
    }
});

/**--------------------------------------------------------
    🌿 Predict relapse overview (profile + aggregates)
-----------------------------------------------------------*/
export const predictRelapseOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    // Validate input
    const parsed = PredictRelapseOverviewSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "ValidationError",
            message: "Invalid relapse overview payload",
            details: parsed.error.flatten(),
        });
    }

    // Proceed with prediction
    const input = parsed.data as PredictRelapseOverviewDTO;

    // Log initiation
    safeLogInfo(
        "Relapse overview prediction initiated",
        { userId, avg_urge_7d: (input as any).avg_urge_7d, avg_health_stress_7d: (input as any).avg_health_stress_7d },
        userId
    );

    // Call prediction service
    try {
        const prediction = await (predictService as any).predictRelapseOverview(userId, input);

        // Log success
        safeLogInfo(
            "Relapse overview prediction completed",
            { userId, risk_score: (prediction as any).risk_score, bucket: (prediction as any).risk_bucket },
            userId
        );

        // Respond with prediction
        res.status(201).json({ ok: true, prediction });
    } catch (err: any) {
        safeLogError("Relapse overview prediction failed", { userId, error: err?.message ?? String(err) }, userId);

        // Respond with error
        res.status(502).json({
            ok: false,
            error: "PredictionServiceUnavailable",
            message: "Prediction service unavailable",
            details: err?.message ?? String(err),
        });
    }
});

export default {
    predictRelapseRisk,
    predictRelapseOverview,
};
