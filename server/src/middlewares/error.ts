// server/src/middlewares/error.ts
import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Middleware: Handles requests to undefined routes.
 */
export const notFound = (_req: Request, res: Response): void => {
    res.status(404).json({
        error: "NotFound",
        message: "The requested resource was not found.",
    });
};

/**
 * Global Error Handler
 * Catches and logs errors consistently.
 */
export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let status = err.status || err.statusCode || 500;
    let code = "InternalError";
    let message = err.message || "Something went wrong.";

    // Handle Axios/ML proxy errors
    if (err?.isAxiosError) {
        status = err.response?.status || 502;
        code = "UpstreamError";
        message = err.response?.data?.detail || err.message;
    }

    // Handle Mongoose errors
    if (err?.name === "ValidationError") {
        status = 400;
        code = "ValidationError";
    } else if (err?.name === "CastError") {
        status = 400;
        code = "BadRequest";
        message = "Invalid resource identifier.";
    }

    // Construct payload
    const payload: Record<string, any> = { error: code, message };

    if (process.env.NODE_ENV !== "production") {
        payload.stack = err.stack;
        if (err.details) payload.details = err.details;
    }

    // 🔹 Log error
    logger.error(`[${code}] ${message}`);
    if (err.stack && process.env.NODE_ENV !== "production") {
        logger.error(err.stack);
    }

    res.status(status).json(payload);
};
