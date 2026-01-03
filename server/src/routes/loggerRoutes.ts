// server/src/routes/loggerRoutes.ts

import { Router } from "express";
import mongoose from "mongoose";
import { LogEvent } from "../models";
import { authentication } from "../middlewares";


// Initialize router
const router = Router();

/**----------------------
    OPTIONS /api/logs
-------------------------*/
router.options("/", (_req, res) => res.sendStatus(204));

/**--------------------------------------------
    ✅ Enums aligned with LogModel.ts
---------------------------------------------*/
const LEVELS = new Set(["info", "warning", "error", "debug"]);

const CATEGORIES = new Set([
    "auth",
    "ml",
    "ui",
    "network",
    "alert",
    "summary",
    "game",
    "bot",
    "journal",
    "health",
    "system",
    "unknown",
]);

/**--------------------------------------------
    ✅ Helpers
---------------------------------------------*/
function isValidObjectId(value: unknown): value is string {
    return typeof value === "string" && mongoose.Types.ObjectId.isValid(value);
}

// Ensure timestamp is a valid Date if provided
function normalizeTimestamp(value: unknown): Date | undefined {
    if (!value) return undefined;
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return undefined;
    return d;
}

/**--------------------------------------------------------------------------------
    POST /api/logs — create new log
    (Auth optional: client can log before login; if auth exists, attach userId)

    ✅ Fixes:
    - prevents CastError (invalid userId -> remove it)
    - prevents ValidationError (invalid level/category -> coerce defaults)
    - returns 400 for bad input instead of 500
-----------------------------------------------------------------------------------*/
router.post("/", authentication({ required: false }), async (req, res) => {
    try {
        // Start from request body
        const body: Record<string, unknown> = { ...(req.body ?? {}) };

        // Prefer req.auth userId if present
        const authUserId = req.auth?.userId;
        if (authUserId && !body.userId) body.userId = authUserId;

        // ✅ userId must be castable to ObjectId (otherwise Mongoose throws -> 500)
        if (body.userId && !isValidObjectId(body.userId)) {
            delete body.userId;
        }

        // ✅ level/category must match schema enums
        const level = typeof body.level === "string" ? body.level : undefined;
        const category = typeof body.category === "string" ? body.category : undefined;

        body.level = level && LEVELS.has(level) ? level : "info";
        body.category = category && CATEGORIES.has(category) ? category : "unknown";

        // ✅ message required
        if (typeof body.message !== "string" || !body.message.trim()) {
            return res.status(400).json({
                ok: false,
                error: "BadRequest",
                message: "message is required",
            });
        }

        // ✅ timestamp (optional) - cast safely or drop
        const ts = normalizeTimestamp(body.timestamp);
        if (ts) body.timestamp = ts;
        else delete body.timestamp;

        // ✅ context default
        if (typeof body.context !== "object" || body.context === null) {
            body.context = {};
        }

        // Create the log entry
        const log = await LogEvent.create(body);
        return res.json({ ok: true, data: log });
    } catch (err: any) {
        // ✅ Don’t 500 on validation/cast errors
        if (err?.name === "ValidationError" || err?.name === "CastError") {
            return res.status(400).json({
                ok: false,
                error: err.name,
                message: err.message,
            });
        }

        return res.status(500).json({
            ok: false,
            error: "ServerError",
            message: err?.message ?? "Unknown error",
        });
    }
});

/**-------------------------------------------
    GET /api/logs — list logs (filterable)

    ✅ Fixes:
    - validates userId as ObjectId before querying
    - validates category/level enums before querying
----------------------------------------------*/
router.get("/", authentication({ required: false }), async (req, res) => {
    try {
        const { userId, category, level, page = 1, limit = 50 } = req.query;

        const query: Record<string, unknown> = {};

        if (userId && isValidObjectId(userId)) query.userId = userId;
        if (typeof category === "string" && CATEGORIES.has(category)) query.category = category;
        if (typeof level === "string" && LEVELS.has(level)) query.level = level;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));

        const logs = await LogEvent.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        const total = await LogEvent.countDocuments(query);

        return res.json({
            ok: true,
            data: logs,
            pagination: { total, page: pageNum, limit: limitNum },
        });
    } catch (err: any) {
        return res.status(500).json({
            ok: false,
            error: "ServerError",
            message: err?.message ?? "Unknown error",
        });
    }
});

/**----------------------------------------
    DELETE /api/logs/:id — remove a log
-------------------------------------------*/
router.delete("/:id", authentication({ required: true }), async (req, res) => {
    try {
        // Optional: validate id format first
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({ ok: false, error: "BadRequest", message: "Invalid id" });
        }

        const deleted = await LogEvent.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });

        return res.json({ ok: true, message: "Log deleted", data: deleted });
    } catch (err: any) {
        return res.status(500).json({
            ok: false,
            error: "ServerError",
            message: err?.message ?? "Unknown error",
        });
    }
});

export default router;
