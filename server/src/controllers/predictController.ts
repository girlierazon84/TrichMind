// server/src/controllers/predictController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { PredictSchema } from "../schemas";
import type { PredictDTO } from "../schemas";
import { loggerService, predictService } from "../services";

/**--------------------------------------------------
    🧠 Predict relapse risk via FastAPI ML model
-----------------------------------------------------**/
export const predictRelapseRisk = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.auth?.userId!;
        const input = PredictSchema.parse(req.body) as PredictDTO;

        await loggerService.logInfo("Prediction request initiated", {
            userId,
            inputPreview: input.emotion,
        });

        try {
            const prediction = await predictService.predict(userId, input);
            await loggerService.logInfo("Prediction completed", {
                userId,
                risk_score: prediction.risk_score,
                bucket: prediction.risk_bucket,
            });

            res.status(201).json({ ok: true, prediction });
        } catch (err: any) {
            await loggerService.log(
                "Prediction service failed",
                "error",
                "ml",
                {
                    userId,
                    error: err.message,
                }
            );

            res.status(502).json({
                ok: false,
                error: "Prediction service unavailable",
                details: err.message,
            });
        }
    }
);

export default predictRelapseRisk;
