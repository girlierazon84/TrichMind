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
import trichGameRoutes from "./trichGameRoutes";
import triggersInsightsRoutes from "./triggersInsightsRoutes";
import userRoutes from "./userRoutes";



// Main router that combines all route modules
const router = Router();

// Mounting individual route modules
router.use("/alerts", alertRoutes);
router.use("/auth", authRoutes);
router.use("/health", healthRoutes);
router.use("/journal", journalRoutes);
router.use("/logs", loggerRoutes);
router.use("/predict", predictRoutes);
router.use("/relapse-overview", relapseOverviewRoutes);
router.use("/summary", summaryRoutes);
router.use("/bot", trichBotRoutes);
router.use("/game", trichGameRoutes);
router.use("/triggers", triggersInsightsRoutes);
router.use("/user", userRoutes);

export default router;
