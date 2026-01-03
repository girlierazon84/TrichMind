// server/src/controllers/summaryController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, summaryService } from "../services";


/**---------------------------
    fire-and-forget logger
------------------------------*/
function safeLogInfo(message: string, context?: Record<string, unknown>) {
    try {
        void (loggerService as any).logInfo(message, context, "summary");
    } catch { }
}
function safeLogError(message: string, context?: Record<string, unknown>) {
    try {
        void (loggerService as any).logError(message, context, "summary");
    } catch { }
}

/**-------------------------------------------
    📬 Send weekly summaries to all users
----------------------------------------------*/
export const sendWeeklySummaries = asyncHandler(async (_req: Request, res: Response) => {
    try {
        safeLogInfo("Weekly summary dispatch started");

        const { successCount, failedCount, message } = await summaryService.sendWeeklySummaries();

        safeLogInfo("Weekly summary dispatch completed", { successCount, failedCount });

        res.status(200).json({ ok: true, message, successCount, failedCount });
    } catch (err: any) {
        safeLogError("Weekly summary error", { error: err?.message ?? String(err) });

        res.status(500).json({
            ok: false,
            error: "WeeklySummaryFailed",
            message: "Failed to send weekly summaries",
            details: err?.message ?? String(err),
        });
    }
});

export default sendWeeklySummaries;
