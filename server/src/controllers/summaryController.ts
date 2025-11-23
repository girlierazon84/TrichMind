// server/src/controllers/summaryController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, summaryService } from "../services";

/**-------------------------------------------
    📬 Send weekly summaries to all users
----------------------------------------------**/
export const sendWeeklySummaries = asyncHandler(
    async (_req: Request, res: Response) => {
        try {
            await loggerService.logInfo("📅 Weekly summary dispatch started");

            const { successCount, failedCount, message } =
                await summaryService.sendWeeklySummaries();

            await loggerService.logInfo(
                "✅ Weekly summary dispatch completed",
                {
                    successCount,
                    failedCount,
                }
            );

            res.status(200).json({
                ok: true,
                message,
                successCount,
                failedCount,
            });
        } catch (err: any) {
            await loggerService.logError("❌ Weekly summary error", {
                error: err.message,
            });
            res.status(500).json({
                ok: false,
                error: "Failed to send weekly summaries",
                details: err.message,
            });
        }
    }
);

export default sendWeeklySummaries;
