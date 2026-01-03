// server/src/routes/index.ts

import { Router } from "express";

import alertRoutes from "./alertRoutes";
import authRoutes from "./authRoutes";
import healthRoutes from "./healthRoutes";
import journalRoutes from "./journalRoutes";
import loggerRoutes from "./loggerRoutes";
import predictRoutes from "./predictRoutes";
import relapseOverviewRoutes from "./relapseOverviewRoutes";
import summaryRoutes from "./summaryRoutes";
import trichBotRoutes from "./trichBotRoutes";
import trichGameRoutes from "./gameRoutes";
import triggersInsightsRoutes from "./triggersInsightsRoutes";
import userRoutes from "./userRoutes";


// Initialize the main router
const router = Router();

/**---------------------------------
    ✅ New, clean API structure
------------------------------------*/
router.use("/alerts", alertRoutes);
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/journal", journalRoutes);
router.use("/logs", loggerRoutes);

router.use("/ml", predictRoutes);          // NEW: /api/ml/...
router.use("/overview", relapseOverviewRoutes); // NEW: /api/overview/relapse
router.use("/summary", summaryRoutes);

router.use("/trichbot", trichBotRoutes);   // NEW: /api/trichbot
router.use("/game", trichGameRoutes);
router.use("/triggers", triggersInsightsRoutes);
router.use("/users", userRoutes);          // NEW: /api/users/profile etc.

/**-----------------------------------------------------------
    🧩 Legacy aliases (so older client paths don’t break)
--------------------------------------------------------------*/
router.use("/predict", predictRoutes);     // old: /api/predict → now /api/ml
router.use("/relapse-overview", relapseOverviewRoutes); // old: /api/relapse-overview/relapse
router.use("/bot", trichBotRoutes);        // old: /api/bot → now /api/trichbot
router.use("/user", userRoutes);           // old: /api/user → now /api/users

export default router;
