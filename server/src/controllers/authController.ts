// server/src/controllers/authController.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { ENV } from "../config/env";
import { RegisterDTO, LoginDTO } from "../schemas/userSchema";
import { sendMail } from "../utils/mailer";
import { buildWelcomeEmail } from "../templates/welcomeEmail";
import { buildResetPasswordEmail } from "../templates/resetPasswordEmail";
import { loggerService } from "../services/loggerService";
import { userService } from "../services/userService";

/* ─────────────────────────────────────────────────────────────
 * 🔐 Generate Access & Refresh Tokens
 * ───────────────────────────────────────────────────────────── */
const generateTokens = (userId: string) => {
    const accessToken = jwt.sign({ sub: userId }, ENV.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

/* ─────────────────────────────────────────────────────────────
 * 🧍 Register New User + Send Welcome Email
 * ───────────────────────────────────────────────────────────── */
export const register = async (req: Request, res: Response) => {
    try {
        const data = RegisterDTO.parse(req.body);
        const user = await userService.register(data);
        const { accessToken, refreshToken } = generateTokens(user._id.toString());

        const { html, text } = buildWelcomeEmail(user.displayName);
        await sendMail(user.email, "Welcome to TrichMind 💚", html, text);
        await loggerService.logInfo("Welcome email sent", { userId: user._id.toString(), email: user.email });

        res.status(201).json({
            ok: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
            },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        await loggerService.logError("❌ Registration error", { error: err.message });
        res.status(400).json({ error: err.message || "Registration failed" });
    }
};

/* ─────────────────────────────────────────────────────────────
 * 🔑 Login Existing User
 * ───────────────────────────────────────────────────────────── */
export const login = async (req: Request, res: Response) => {
    try {
        const credentials = LoginDTO.parse(req.body);
        const user = await userService.login(credentials);

        const { accessToken, refreshToken } = generateTokens(user._id.toString());
        await loggerService.logInfo("User logged in", { userId: user._id.toString(), email: user.email });

        res.json({
            ok: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
            },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        await loggerService.log("Invalid login attempt", "warning", "auth", { email: req.body.email });
        res.status(401).json({ error: err.message || "Invalid credentials" });
    }
};

/* ─────────────────────────────────────────────────────────────
 * ♻️ Refresh Access Token
 * ───────────────────────────────────────────────────────────── */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Missing refresh token" });

        const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { sub: string };
        const newAccessToken = jwt.sign({ sub: decoded.sub }, ENV.JWT_SECRET, { expiresIn: "15m" });

        await loggerService.logInfo("Access token refreshed", { userId: decoded.sub });
        res.json({ ok: true, accessToken: newAccessToken });
    } catch (err: any) {
        await loggerService.log("Invalid refresh token attempt", "warning", "auth");
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

/* ─────────────────────────────────────────────────────────────
 * ✉️ Forgot Password — Send Reset Link
 * ───────────────────────────────────────────────────────────── */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await userService.findByEmail(email);

        if (!user) {
            await loggerService.log("Password reset requested for non-existent email", "warning", "auth", { email });
            return res.json({ ok: true, message: "If the email exists, a reset link was sent." });
        }

        const resetToken = jwt.sign({ sub: user._id.toString() }, ENV.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;

        const { html, text } = buildResetPasswordEmail(resetLink, user.displayName);
        await sendMail(user.email, "Reset Your TrichMind Password", html, text);

        await loggerService.logInfo("Password reset email sent", { email: user.email });
        res.json({ ok: true, message: "Password reset link sent." });
    } catch (err: any) {
        await loggerService.logError("Forgot password error", { error: err.message });
        res.status(500).json({ error: "Failed to send password reset email" });
    }
};

/* ─────────────────────────────────────────────────────────────
 * 🔒 Reset Password — Validate Token + Update Password
 * ───────────────────────────────────────────────────────────── */
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return res.status(400).json({ error: "Token and new password required" });

        const decoded = jwt.verify(token, ENV.JWT_SECRET) as { sub: string };
        const user = await userService.getById(decoded.sub);

        if (!user) return res.status(404).json({ error: "User not found" });

        const hashed = await bcrypt.hash(newPassword, 10);
        await userService.updateProfile(user._id.toString(), { password: hashed });

        await loggerService.logInfo("Password reset successful", { userId: user._id.toString() });
        res.json({ ok: true, message: "Password updated successfully" });
    } catch (err: any) {
        await loggerService.log("Invalid or expired reset token", "warning", "auth");
        res.status(400).json({ error: "Invalid or expired token" });
    }
};
