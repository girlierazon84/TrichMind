// src/routes/authRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
} from "../controllers";
import { RegisterDTO, LoginDTO } from "../schemas";
import { User } from "../models";

// Initialize router
const router = Router();

/* ──────────────────────────────
    🔹 POST /api/auth/register
──────────────────────────────── */
router.post("/register", validate(RegisterDTO), register);

/* ──────────────────────────────
    🔹 POST /api/auth/login
──────────────────────────────── */
router.post("/login", validate(LoginDTO), login);

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
    🔹 GET /api/auth/me
──────────────────────────────── */
router.get("/me", authentication(), async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const user = await User.findById(userId).select("-password").lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ ok: true, user });
    } catch (err) {
        console.error("❌ /me error:", err);
        res.status(500).json({ error: "Failed to fetch user profile" });
    }
});

export default router;
