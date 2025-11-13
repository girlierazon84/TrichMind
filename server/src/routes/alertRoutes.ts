// server/src/routes/alertRoutes.ts

import { Router } from "express";
import { sendRelapseAlert } from "../controllers";
import { authentication } from "../middlewares";

// Initialize router
const router = Router();

// 🔔 POST /api/alerts/relapse
router.post("/relapse", authentication(), sendRelapseAlert);

export default router;
