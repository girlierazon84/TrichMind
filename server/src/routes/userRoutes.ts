// server/src/routes/userRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { User } from "../models/UserModel";
import { HealthLog } from "../models/HealthLog";
import { asyncHandler } from "../utils/asyncHandler";


// Initialize router
const router = Router();

// 🟢 User Routes
router.get(
    "/profile",
    // Get user profile
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Fetch user profile excluding password
        const user = await User.findById(req.auth!.userId).select("-password").lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ ok: true, user });
    })
);

// Get latest health log for authenticated user
router.get(
    "/health/latest",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Fetch the latest health log entry for the user
        const log = await HealthLog.findOne({ userId: req.auth!.userId })
            .sort({ date: -1 })
            .lean();
        res.json({ ok: true, latest: log || {} });
    })
);

export default router;
