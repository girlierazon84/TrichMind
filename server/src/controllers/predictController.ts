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


type MlCategory = Parameters<typeof loggerService.logInfo>[2];

type PredictionLike = {
    risk_score?: number | null;
    risk_bucket?: string;
    confidence?: number | null;
    model_version?: string;
};

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: MlCategory = "ml"
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch {
        // ignore
    }
}
function safeLogError(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: MlCategory = "ml"
) {
    try {
        void loggerService.logError(message, context, category, userId);
    } catch {
        // ignore
    }
}

/**---------------------------------------------
    🧠 Predict relapse risk (friendly/core)
------------------------------------------------*/
export const predictRelapseRisk = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = PredictSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "ValidationError",
            message: "Invalid prediction payload",
            details: parsed.error.flatten(),
        });
    }

    const input = parsed.data as PredictDTO;

    safeLogInfo("Prediction request initiated", { userId, emotion: input.emotion }, userId);

    try {
        const predictionRaw = await predictService.predict(userId, input);
        const prediction = predictionRaw as unknown as PredictionLike;

        safeLogInfo(
            "Prediction completed",
            {
                userId,
                risk_score: prediction.risk_score ?? null,
                bucket: prediction.risk_bucket ?? "unknown",
            },
            userId
        );

        return res.status(201).json({ ok: true, prediction: predictionRaw });
    } catch (err: unknown) {
        const msg = getErrorMessage(err);
        safeLogError("Prediction service failed", { userId, error: msg }, userId);

        return res.status(502).json({
            ok: false,
            error: "PredictionServiceUnavailable",
            message: "Prediction service unavailable",
            details: msg,
        });
    }
});

/**--------------------------------------------------------
    🌿 Predict relapse overview (profile + aggregates)
-----------------------------------------------------------*/
type PredictServiceWithOverview = {
    predictRelapseOverview: (userId: string, input: PredictRelapseOverviewDTO) => Promise<unknown>;
};

export const predictRelapseOverview = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const parsed = PredictRelapseOverviewSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "ValidationError",
            message: "Invalid relapse overview payload",
            details: parsed.error.flatten(),
        });
    }

    const input = parsed.data as PredictRelapseOverviewDTO;

    safeLogInfo("Relapse overview prediction initiated", { userId }, userId);

    try {
        const svc = predictService as unknown as PredictServiceWithOverview;
        const predictionRaw = await svc.predictRelapseOverview(userId, input);
        const prediction = predictionRaw as unknown as PredictionLike;

        safeLogInfo(
            "Relapse overview prediction completed",
            {
                userId,
                risk_score: prediction.risk_score ?? null,
                bucket: prediction.risk_bucket ?? "unknown",
            },
            userId
        );

        return res.status(201).json({ ok: true, prediction: predictionRaw });
    } catch (err: unknown) {
        const msg = getErrorMessage(err);
        safeLogError("Relapse overview prediction failed", { userId, error: msg }, userId);

        return res.status(502).json({
            ok: false,
            error: "PredictionServiceUnavailable",
            message: "Prediction service unavailable",
            details: msg,
        });
    }
});

export default {
    predictRelapseRisk,
    predictRelapseOverview,
};
