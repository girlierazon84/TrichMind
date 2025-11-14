// server/src/routes/userRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import { User, HealthLog } from "../models";
import { asyncHandler } from "../utils";


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

// PATCH /api/users/profile — update user profile
router.patch(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

        const allowed = [
            "displayName",
            "age",
            "years_since_onset",
            "avatarUrl",
        ];

        const updates: Record<string, any> = {};
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        });

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
        }).select("-password");

        res.json({ ok: true, user });
    })
);

export default router;
