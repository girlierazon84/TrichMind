// server/src/middlewares/errorHandler.ts

import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils";

/**-------------------------------------
🚫 Middleware: Handles undefined routes
----------------------------------------**/
export const notFound = (_req: Request, res: Response): void => {
    res.status(404).json({
        ok: false,
        error: "NotFound",
        message: "The requested resource was not found.",
    });
};

/**---------------------------------------------------------------------------
💥 Global Error Handler
Catches and logs all server, validation, or external API errors consistently.
------------------------------------------------------------------------------**/
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let status = err.status || err.statusCode || 500;
    let code = "InternalError";
    let message = err.message || "Something went wrong.";

    // 🧠 Handle Axios / ML proxy errors
    if (err?.isAxiosError) {
        status = err.response?.status || 502;
        code = "UpstreamError";
        message =
            err.response?.data?.detail ||
            err.response?.data?.error ||
            err.response?.data?.message ||
            err.message ||
            "Error connecting to ML service.";
    }

    // 🧩 Handle Mongo / Mongoose validation issues
    if (err?.name === "ValidationError") {
        status = 400;
        code = "ValidationError";
        message = "Validation failed. Please check your input.";
    } else if (err?.name === "CastError") {
        status = 400;
        code = "BadRequest";
        message = "Invalid resource identifier.";
    }

    // 🧾 Handle Zod validation errors
    if (err?.name === "ZodError") {
        status = 400;
        code = "ValidationError";
        message = "Invalid request payload.";
    }

    // 🧰 Build standard JSON response payload
    const payload: Record<string, any> = {
        ok: false,
        error: code,
        message,
    };

    if (err?.details) payload.details = err.details;
    if (process.env.NODE_ENV !== "production" && err?.stack) {
        payload.stack = err.stack;
    }

    // 🧠 Log formatted error
    console.error("\n❌ Global error caught");
    console.error(`📍 Route: ${req.method} ${req.originalUrl}`);
    console.error("🧩 Error Type:", code);
    console.error("📢 Message:", message);
    if (Object.keys(req.body || {}).length > 0) {
        console.error("📦 Payload:", JSON.stringify(req.body, null, 2));
    }
    if (err.stack && process.env.NODE_ENV !== "production") {
        console.error(err.stack);
    }
    // 🪵 Send to Winston logger too
    logger.error(`[${code}] ${message}`);
    if (err.stack && process.env.NODE_ENV !== "production") {
        logger.error(err.stack);
    }

    // 🚀 Return clean JSON to client
    res.status(status).json(payload);
};
