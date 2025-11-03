// server/src/routes/loggerRoutes.ts

import { Router } from "express";
import { LogEvent } from "../models/LogModel";


// Initialize Router
const router = Router();

/**---------------------------------------------
🪵 POST /api/logs — create new log
This endpoint allows creating a new log entry.
------------------------------------------------**/
router.post("/", async (req, res) => {
    try {
        // Create new log entry
        const log = await LogEvent.create(req.body);
        res.json({ ok: true, data: log });
    } catch (err: any) {
        // Handle errors
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**-----------------------------------------------------------------------------------------
📋 GET /api/logs — list logs (filterable)
This endpoint retrieves log entries with optional filtering by userId, category, and level.
--------------------------------------------------------------------------------------------**/
router.get("/", async (req, res) => {
    try {
        // Extract query parameters
        const { userId, category, level, page = 1, limit = 50 } = req.query;

        // Build query object
        const query: any = {};
        if (userId) query.userId = userId;
        if (category) query.category = category;
        if (level) query.level = level;

        // Fetch logs with pagination
        const logs = await LogEvent.find(query)
            .sort({ createdAt: -1 })
            .skip((+page - 1) * +limit)
            .limit(+limit);

        // Get total count
        const total = await LogEvent.countDocuments(query);

        // Respond with logs and pagination info
        res.json({
            ok: true,
            data: logs,
            pagination: { total, page: +page, limit: +limit },
        });
    } catch (err: any) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**-------------------------------------------
❌ DELETE /api/logs/:id — remove a log
This endpoint deletes a log entry by its ID.
----------------------------------------------**/
router.delete("/:id", async (req, res) => {
    try {
        // Delete log by ID
        const deleted = await LogEvent.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ ok: false, error: "Not found" });
        res.json({ ok: true, message: "Log deleted", data: deleted });
    } catch (err: any) {
        // Handle errors
        res.status(500).json({ ok: false, error: err.message });
    }
});

export default router;
