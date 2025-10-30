// server/src/controllers/alertController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { alertService } from "../services/alertService";
import { loggerService } from "../services/loggerService";

/**
 * ⚠️ Trigger relapse-risk alert email manually or via ML callback
 * Delegates business logic to alertService
 */
export const sendRelapseAlert = asyncHandler(async (req: Request, res: Response) => {
    const { userId, score } = req.body;

    if (!userId || score === undefined) {
        await loggerService.log("Missing userId or score", "warning", "alert");
        return res.status(400).json({ ok: false, error: "userId and score are required" });
    }

    try {
        const result = await alertService.sendRelapseAlert(userId, score);
        await loggerService.logInfo("Relapse alert processed", { userId, score, result });
        res.status(200).json({ ok: true, ...result });
    } catch (error: any) {
        await loggerService.logError("Relapse alert error", { userId, score, error: error.message });
        res.status(500).json({ ok: false, error: error.message || "Failed to send relapse alert" });
    }
});
