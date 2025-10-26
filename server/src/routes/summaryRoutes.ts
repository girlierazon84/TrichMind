import { Router } from "express";
import { sendWeeklySummaries } from "../controllers/summaryController";
import { authentication } from "../middlewares/authMiddleware";

const router = Router();

// 🔹 Manual trigger (for admin/testing)
router.post("/weekly", authentication({ required: false }), sendWeeklySummaries);

export default router;
