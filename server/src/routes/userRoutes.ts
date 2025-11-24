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
        const dbUser = await User.findById(req.auth!.userId)
            .select("-password")
            .lean();

        if (!dbUser) {
            return res
                .status(404)
                .json({ ok: false, error: "User not found" });
        }

        // Ensure coping arrays are never null/undefined on the wire
        const user = {
            ...dbUser,
            coping_worked: (dbUser as any).coping_worked ?? [],
            coping_not_worked: (dbUser as any).coping_not_worked ?? [],
        };

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

        // ⬇️ Allow core profile fields + coping strategies
        const allowed = [
            "displayName",
            "age",
            "years_since_onset",
            "avatarUrl",
            "coping_worked",
            "coping_not_worked",
        ];

        const updates: Record<string, any> = {};

        for (const key of allowed) {
            if (req.body[key] === undefined) continue;

            // Normal profile fields
            if (
                key === "displayName" ||
                key === "age" ||
                key === "years_since_onset" ||
                key === "avatarUrl"
            ) {
                updates[key] = req.body[key];
                continue;
            }

            // 🔁 Coping strategies: accept array or comma-separated string
            if (key === "coping_worked" || key === "coping_not_worked") {
                const raw = req.body[key];

                if (Array.isArray(raw)) {
                    updates[key] = raw.map(String).filter(Boolean);
                } else if (typeof raw === "string") {
                    updates[key] = raw
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                } else {
                    // Fallback: ignore weird types instead of blowing up
                    updates[key] = [];
                }
            }
        }

        const dbUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
        }).select("-password");

        if (!dbUser) {
            return res
                .status(404)
                .json({ ok: false, error: "User not found" });
        }

        // Make sure coping_* are arrays in the response too
        const user = {
            ...dbUser.toObject(),
            coping_worked: (dbUser as any).coping_worked ?? [],
            coping_not_worked: (dbUser as any).coping_not_worked ?? [],
        };

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
