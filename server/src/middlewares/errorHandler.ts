// server/src/middlewares/errorHandler.ts

import type { Request, Response, NextFunction } from "express";
import { ENV } from "../config";
import { logger } from "../utils";


/**---------------------------------------------
    🚫 Middleware: Handles undefined routes
------------------------------------------------*/
export const notFound = (req: Request, res: Response): void => {
    res.status(404).json({
        ok: false,
        error: "NotFound",
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
};

/**-----------------------------
    💥 Global Error Handler
--------------------------------*/
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void => {
    let status = err?.status || err?.statusCode || 500;
    let code = "InternalError";
    let message = err?.message || "Something went wrong.";

    // Axios → upstream (ML) failures
    if (err?.isAxiosError) {
        status = err?.response?.status || 502;
        code = "UpstreamError";
        message =
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Upstream request failed.";
    }

    // Mongoose common errors
    if (err?.name === "ValidationError") {
        status = 400;
        code = "ValidationError";
        message = "Validation failed. Please check your input.";
    } else if (err?.name === "CastError") {
        status = 400;
        code = "BadRequest";
        message = "Invalid resource identifier.";
    }

    // Zod validation
    if (err?.name === "ZodError") {
        status = 400;
        code = "ValidationError";
        message = "Invalid request payload.";
    }

    // JWT errors
    const payload: Record<string, unknown> = {
        ok: false,
        error: code,
        message,
    };

    // Include additional details for certain error types
    if (err?.details) payload.details = err.details;
    if (ENV.NODE_ENV !== "production" && err?.stack) payload.stack = err.stack;

    // Console debug (dev-friendly)
    console.error("\n❌ Global error caught");
    console.error(`📍 Route: ${req.method} ${req.originalUrl}`);
    console.error("🧩 Error Type:", code);
    console.error("📢 Message:", message);
    if (Object.keys(req.body || {}).length > 0) {
        console.error("📦 Payload:", JSON.stringify(req.body, null, 2));
    }
    if (ENV.NODE_ENV !== "production" && err?.stack) console.error(err.stack);

    // File logger (redacted + structured)
    logger.error(`[${code}] ${message}`, {
        route: `${req.method} ${req.originalUrl}`,
        status,
        hasBody: Boolean(req.body && Object.keys(req.body).length),
    });

    // Send response
    res.status(status).json(payload);
};

export default { notFound, errorHandler };
