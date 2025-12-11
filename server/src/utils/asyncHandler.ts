// server/src/utils/asyncHandler.ts

import type { RequestHandler } from "express";


/**---------------------------------------------------------------
🧠 asyncHandler — Elegant async wrapper for Express routes.
Prevents repetitive try/catch blocks and logs rich error context.
------------------------------------------------------------------**/
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (err: any) {
            console.error("\n❌ Async route error caught");
            console.error(`📍 Route: ${req.method} ${req.originalUrl}`);

            // Safely print request payload if present
            if (Object.keys(req.body || {}).length > 0) {
                console.error("📦 Payload:", safeJson(req.body));
            }

            // Print detailed error stack for debugging
            console.error("🧩 Error Message:", err.message);
            if (err.stack) console.error(err.stack);

            if (res.headersSent) {
                return next(err);
            }

            // Send clean JSON response
            res.status(err.status || 500).json({
                ok: false,
                error: err.name || "InternalServerError",
                message: err.message || "Unexpected server error occurred.",
            });
        }
    };
};

/**------------------------------------------------------
Safely stringify objects for logs (avoids circular refs)
---------------------------------------------------------**/
function safeJson(obj: any): string {
    try {
        return JSON.stringify(obj, null, 2);
    } catch {
        return "[Unserializable payload]";
    }
}

export default asyncHandler;
