// server/src/controllers/summaryController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, summaryService } from "../services";


/**--------------------------------------------------------------------
📬 Send weekly summaries to all users
Delegates summary generation and email sending to the summaryService.
-----------------------------------------------------------------------**/
export const sendWeeklySummaries = asyncHandler(async (_req: Request, res: Response) => {
    // Log the start of the summary dispatch
    try {
        await loggerService.logInfo("📅 Weekly summary dispatch started");

        // Call the summary service to send summaries
        const { successCount, failedCount, message } = await summaryService.sendWeeklySummaries();

        // Log the completion of the summary dispatch
        await loggerService.logInfo("✅ Weekly summary dispatch completed", {
            successCount,
            failedCount,
        });

        // Return the summary dispatch result
        res.status(200).json({
            ok: true,
            message,
            successCount,
            failedCount,
        });
    } catch (err: any) {
        // Log the error
        await loggerService.logError("❌ Weekly summary error", { error: err.message });
        res.status(500).json({
            ok: false,
            error: "Failed to send weekly summaries",
            details: err.message,
        });
    }
});
