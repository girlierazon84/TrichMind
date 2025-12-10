// server/src/routes/authRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
} from "../controllers";
import { RegisterSchema, LoginSchema } from "../schemas";
import { User } from "../models";
import { asyncHandler } from "../utils";


/* ──────────────────────────────
    🔹 Auth Routes
──────────────────────────────── */
const router = Router();

/* ──────────────────────────────
    🔹 POST /api/auth/register
    Logs incoming body for debugging on Render
──────────────────────────────── */
router.post(
    "/register",
    validate(RegisterSchema),
    // 🔥 Debug middleware – see what the backend receives
    (req, _res, next) => {
        console.log("🔥 [AUTH] /register incoming body:", req.body);
        next();
    },
    register
);

/* ──────────────────────────────
    🔹 POST /api/auth/login
──────────────────────────────── */
router.post("/login", validate(LoginSchema), login);

/* ──────────────────────────────
    🔹 POST /api/auth/refresh
──────────────────────────────── */
router.post("/refresh", refreshToken);

/* ──────────────────────────────
    🔹 POST /api/auth/forgot-password
──────────────────────────────── */
router.post("/forgot-password", forgotPassword);

/* ──────────────────────────────
    🔹 POST /api/auth/reset-password
──────────────────────────────── */
router.post("/reset-password", resetPassword);

/* ──────────────────────────────
    🔹 POST /api/auth/change-password
    Uses asyncHandler + authentication
──────────────────────────────── */
router.post(
    "/change-password",
    authentication(),
    asyncHandler(async (req, res) => {
        const { oldPassword, newPassword } = req.body;
        const userId = req.auth?.userId;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                ok: false,
                error: "BadRequest",
                message: "Missing old or new password",
            });
        }

        const user = await User.findById(userId).select("+password");
        if (!user) {
            return res.status(404).json({
                ok: false,
                error: "NotFound",
                message: "User not found",
            });
        }

        // assuming User model has comparePassword()
        const match = await (user as any).comparePassword(oldPassword);
        if (!match) {
            return res.status(400).json({
                ok: false,
                error: "InvalidCredentials",
                message: "Incorrect old password",
            });
        }

        user.password = newPassword;
        await user.save();

        return res.json({
            ok: true,
            message: "Password updated!",
        });
    })
);

/* ──────────────────────────────
    🔹 GET /api/auth/me
    Returns a shaped user object with coping strategies arrays
    Uses asyncHandler for clean error handling
──────────────────────────────── */
router.get(
    "/me",
    authentication(),
    asyncHandler(async (req, res) => {
        const userId = req.auth?.userId;
        const dbUser = await User.findById(userId)
            .select("-password")
            .lean();

        if (!dbUser) {
            return res.status(404).json({
                ok: false,
                error: "NotFound",
                message: "User not found",
            });
        }

        res.json({
            ok: true,
            user: {
                id: dbUser._id.toString(),
                email: dbUser.email,
                displayName: dbUser.displayName,
                avatarUrl: dbUser.avatarUrl,
                date_of_birth: dbUser.date_of_birth,

                // Behavioural fields
                age: dbUser.age,
                age_of_onset: dbUser.age_of_onset,
                years_since_onset: dbUser.years_since_onset,
                pulling_severity: dbUser.pulling_severity,
                pulling_frequency_encoded: dbUser.pulling_frequency_encoded,
                awareness_level_encoded: dbUser.awareness_level_encoded,
                successfully_stopped_encoded: dbUser.successfully_stopped_encoded,
                how_long_stopped_days_est: dbUser.how_long_stopped_days_est,
                emotion: dbUser.emotion,

                // ⬇️ Coping strategies – always arrays for frontend
                coping_worked: (dbUser as any).coping_worked ?? [],
                coping_not_worked: (dbUser as any).coping_not_worked ?? [],
            },
        });
    })
);

export default router;
