// server/src/routes/userRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import { User, HealthLog } from "../models";
import { asyncHandler } from "../utils";


/* ──────────────────────────────
    🔹 User Routes
──────────────────────────────── */
const router = Router();

/* 🟢 GET /api/users/profile — current user profile */
router.get(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.auth!.userId)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }

        res.json({ ok: true, user });
    })
);

/* 🩺 GET /api/users/health/latest — latest health log */
router.get(
    "/health/latest",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const log = await HealthLog.findOne({ userId: req.auth!.userId })
            .sort({ date: -1 })
            .lean();

        res.json({ ok: true, latest: log || {} });
    })
);

/* ✏️ PATCH /api/users/profile — update user profile */
router.patch(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

        const allowed = ["displayName", "age", "years_since_onset", "avatarUrl"];

        const updates: Record<string, any> = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        const user = await User.findByIdAndUpdate(userId, updates, {
            new: true,
        }).select("-password");

        if (!user) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }

        res.json({ ok: true, user });
    })
);

/* 🗑️ DELETE /api/users/delete — delete account */
router.delete(
    "/delete",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        await User.findByIdAndDelete(req.auth!.userId);
        return res.json({ ok: true, message: "Account deleted" });
    })
);

export default router;
