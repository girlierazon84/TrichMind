// server/src/routes/summaryRoutes.ts

import { Router } from "express";
import { sendWeeklySummaries } from "../controllers";
import { authentication } from "../middlewares";


// Initialize router
const router = Router();

// 🔹 Manual trigger (for admin/testing)
router.post("/weekly", authentication({ required: false }), sendWeeklySummaries);

export default router;
