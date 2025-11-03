// server/src/routes/index.ts

import { Router } from "express";
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import healthRoutes from "./healthRoutes";
import journalRoutes from "./journalRoutes";
import triggersInsightsRoutes from "./triggersInsightsRoutes";
import trichGameRoutes from "./trichGameRoutes";
import trichBotRoutes from "./trichBotRoutes";
import predictRoutes from "./predictRoutes";


// Main router that combines all route modules
const router = Router();

// Mounting individual route modules
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/health", healthRoutes);
router.use("/journal", journalRoutes);
router.use("/triggers", triggersInsightsRoutes);
router.use("/game", trichGameRoutes);
router.use("/bot", trichBotRoutes);
router.use("/predict", predictRoutes);

export default router;
