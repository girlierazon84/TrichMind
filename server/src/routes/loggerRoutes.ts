// server/src/routes/loggerRoutes.ts

import { Router } from "express";
import LogEvent from "../models/LogModel";

const router = Router();

/**
 * 🪵 POST /api/logs — create new log
 */
router.post("/", async (req, res) => {
    try {
        const log = await LogEvent.create(req.body);
        res.json({ ok: true, data: log });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * 📋 GET /api/logs — list logs (filterable)
 */
router.get("/", async (req, res) => {
    try {
        const { userId, category, level, page = 1, limit = 50 } = req.query;

        const query: any = {};
        if (userId) query.userId = userId;
        if (category) query.category = category;
        if (level) query.level = level;

        const logs = await LogEvent.find(query)
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        const total = await LogEvent.countDocuments(query);

        res.json({
            ok: true,
            data: logs,
            pagination: { total, page: +page, limit: +limit },
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * ❌ DELETE /api/logs/:id — remove a log
 */
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await LogEvent.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });
        res.json({ ok: true, message: "Log deleted", data: deleted });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
