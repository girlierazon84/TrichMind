// server/src/controllers/predictController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { PredictDTO } from "../schemas/predictSchema";
import { predictService } from "../services/predictService";
import { loggerService } from "../services/loggerService";

/**-----------------------------------------------------
🧠 Predict relapse risk via FastAPI ML model
Stores response in the database through predictService
--------------------------------------------------------**/
export const predictRelapseRisk = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Validate and parse request body
    const input = PredictDTO.parse(req.body);

    // Log the prediction request initiation
    await loggerService.logInfo("Prediction request initiated", { userId, inputPreview: input.emotion });

    // Call the prediction service
    try {
        const prediction = await predictService.predict(userId, input);
        await loggerService.logInfo("Prediction completed", {
            userId,
            risk_score: prediction.risk_score,
            bucket: prediction.risk_bucket,
        });

        // Return the prediction result
        res.status(201).json({ ok: true, prediction });
    } catch (err: any) {
        // Log the error
        await loggerService.log("Prediction service failed", "error", "ml", {
            userId,
            error: err.message,
        });

        // Return a 502 Bad Gateway response
        res.status(502).json({
            ok: false,
            error: "Prediction service unavailable",
            details: err.message,
        });
    }
});
