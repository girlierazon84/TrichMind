// server/src/routes/loggerRoutes.ts

import { Router } from "express";
import { LogEvent } from "../models";

const router = Router();

/**
 * ✅ OPTIONS /api/logs
 * Some proxies/CDNs behave better if the route exists explicitly.
 * Also makes debugging easier (returns 204 immediately).
 */
router.options("/", (_req, res) => {
    return res.sendStatus(204);
});

/**--------------------------------------------------
    🪵 POST /api/logs — create new log
-----------------------------------------------------**/
router.post("/", async (req, res) => {
    try {
        const log = await LogEvent.create(req.body);
        return res.json({ ok: true, data: log });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err.message });
    }
});

/**----------------------------------------------
    📋 GET /api/logs — list logs (filterable)
-------------------------------------------------**/
router.get("/", async (req, res) => {
    try {
        const { userId, category, level, page = 1, limit = 50 } = req.query;

        const query: Record<string, unknown> = {};
        if (userId) query.userId = userId;
        if (category) query.category = category;
        if (level) query.level = level;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(200, Math.max(1, Number(limit) || 50));

        const logs = await LogEvent.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await LogEvent.countDocuments(query);

        return res.json({
            ok: true,
            data: logs,
            pagination: { total, page: pageNum, limit: limitNum },
        });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err.message });
    }
});

/**-------------------------------------------
    ❌ DELETE /api/logs/:id — remove a log
----------------------------------------------**/
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await LogEvent.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ ok: false, error: "Not found" });
        }
        return res.json({ ok: true, message: "Log deleted", data: deleted });
    } catch (err: any) {
        return res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
