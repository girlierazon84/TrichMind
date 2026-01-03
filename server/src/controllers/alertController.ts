// server/src/controllers/alertController.ts

import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils";
import { loggerService, alertService } from "../services";
import type { ILogEvent } from "../models";


// Request body: only score
const SendRelapseAlertSchema = z
    .object({
        score: z.coerce.number().min(0).max(1),
    })
    .strict();

// Logger category for this controller
type LogCategory = ILogEvent["category"];
const CATEGORY: LogCategory = "alert";

// fire-and-forget logger helpers (never throw)
function safeLogInfo(message: string, context?: Record<string, unknown>, userId?: string) {
    try {
        void loggerService.logInfo(message, context ?? {}, CATEGORY, userId);
    } catch { }
}
function safeLogWarn(message: string, context?: Record<string, unknown>, userId?: string) {
    try {
        void loggerService.logWarning(message, context ?? {}, CATEGORY, userId);
    } catch { }
}
function safeLogError(message: string, context?: Record<string, unknown>, userId?: string) {
    try {
        void loggerService.logError(message, context ?? {}, CATEGORY, userId);
    } catch { }
}

/**-----------------------------------------
    ⚠️ Trigger relapse-risk alert email
    POST /api/alerts/relapse
    Body: { score }
    Auth: required (req.auth.userId)
--------------------------------------------*/
export const sendRelapseAlert = asyncHandler(async (req: Request, res: Response) => {
    // Ensure authenticated user exists
    const userId = req.auth?.userId;
    if (!userId) {
        return res.status(401).json({
            ok: false,
            error: "Unauthorized",
            message: "Missing auth",
        });
    }

    // Validate request body schema
    const parsed = SendRelapseAlertSchema.safeParse(req.body);
    if (!parsed.success) {
        safeLogWarn("Invalid relapse alert payload", { issues: parsed.error.flatten() }, userId);

        return res.status(400).json({
            ok: false,
            error: "ValidationError",
            message: "score is required",
            details: parsed.error.flatten(),
        });
    }

    // Extract validated data from parsed object
    const { score } = parsed.data;

    try {
        // Call service to send relapse alert email and log result
        const result = await alertService.sendRelapseAlert(userId, score);

        // Log success and respond to client
        safeLogInfo("Relapse alert processed", { score, result }, userId);
        return res.status(200).json({ ok: true, ...result });
    } catch (err: unknown) {
        // Log error and respond with failure message to client
        const msg = err instanceof Error ? err.message : String(err ?? "Unknown error");

        // Log the error without throwing further errors
        safeLogError("Relapse alert error", { score, error: msg }, userId);

        return res.status(500).json({
            ok: false,
            error: "AlertFailed",
            message: msg || "Failed to send relapse alert",
        });
    }
});

export default sendRelapseAlert;