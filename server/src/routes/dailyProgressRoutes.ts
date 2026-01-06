// server/src/routes/dailyProgressRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import {
    getDaily,
    checkInDaily,
    getDailySummary
} from "../controllers";


const router = Router();

// GET /api/progress/daily
router.get("/daily", authentication({ required: true }), getDaily);

// POST /api/progress/daily/checkin
router.post("/daily/checkin", authentication({ required: true }), checkInDaily);

// GET /api/progress/daily/summary
router.get("/daily/summary", authentication({ required: true }), getDailySummary);

export default router;
