// server/src/routes/dailyProgressRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import { asyncHandler } from "../utils";
import {
    postDailyCheckIn,
    getDailyEntries,
    getDailySummary,
} from "../controllers/dailyProgressController";


const router = Router();

// GET /api/progress/daily
router.get("/daily", authentication({ required: true }), asyncHandler(getDailyEntries));

// POST /api/progress/daily/checkin
router.post("/daily/checkin", authentication({ required: true }), asyncHandler(postDailyCheckIn));

// GET /api/progress/daily/summary
router.get("/daily/summary", authentication({ required: true }), asyncHandler(getDailySummary));

export default router;
