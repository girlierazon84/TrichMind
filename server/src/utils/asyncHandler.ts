// server/src/utils/asyncHandler.ts

import type { Request, Response, NextFunction, RequestHandler } from "express";
import { logger } from "./logger";


/**---------------------------------------------
    Generic error type for caught exceptions
------------------------------------------------*/

// A minimal error shape to extract useful info for logging
type AnyErr = {
    name?: string;
    message?: string;
    stack?: string;
    status?: number;
    statusCode?: number;
};

// Max characters to log from request body/query/params
const MAX_LOG_CHARS = 4_000;

/**-------------------------------------------------------
    Any express handler-like function (sync OR async),
    allowing a *narrower* req type (e.g. AuthRequest).
----------------------------------------------------------*/
export type AnyHandlerFn<Req extends Request = Request, Res extends Response = Response> = (
    req: Req,
    res: Res,
    next: NextFunction
) => unknown | Promise<unknown>;

/**-----------------------------------------------------------------------------
    🧠 asyncHandler — Async wrapper for Express routes.
        - Works with sync + async handlers
        - Logs rich context
        - Delegates response shaping to centralized errorHandler middleware
--------------------------------------------------------------------------------*/
export function asyncHandler<Req extends Request = Request, Res extends Response = Response>(
    fn: AnyHandlerFn<Req, Res>
): RequestHandler {
    return async (req, res, next) => {
        try {
            // Cast req/res to the narrower types the handler expects (safe at runtime)
            await Promise.resolve(fn(req as Req, res as Res, next));
        } catch (err) {
            const e = err as AnyErr;

            // Log rich context for debugging
            logger.error("❌ Async route error", {
                route: `${req.method} ${req.originalUrl}`,
                message: e?.message || "Unknown error",
                name: e?.name || "Error",
                status: e?.status ?? e?.statusCode,
                params: req.params,
                query: req.query,
                bodyPreview: safePreview(req.body),
            });

            // Delegate to centralized error handler
            return next(err);
        }
    };
}

// Safely preview a value for logging
function safePreview(value: unknown): string {
    try {
        if (value == null) return "";
        const raw = JSON.stringify(value);
        return raw.length > MAX_LOG_CHARS
            ? raw.slice(0, MAX_LOG_CHARS) + "…(truncated)"
            : raw;
    } catch {
        return "[Unserializable payload]";
    }
}

export default asyncHandler;
