import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import User from "../models/User";
import { ENV } from "../config/env";
import { RegisterDTO, LoginDTO } from "../schemas/userSchema";
import { sendMail } from "../utils/mailer";
import { buildWelcomeEmail } from "../templates/welcomeEmail";
import { buildResetPasswordEmail } from "../templates/resetPasswordEmail";
import { logger } from "../utils/logger";

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
        const existing = await User.findOne({ email: data.email });

        if (existing) {
            logger.warn(`⚠️ Registration attempt with existing email: ${data.email}`);
            return res.status(409).json({ error: "Email already registered" });
        }

        const user = await User.create(data);
        const { accessToken, refreshToken } = generateTokens(user.id);

        // ✅ Send Welcome Email
        const { html, text } = buildWelcomeEmail(user.displayName);
        await sendMail(user.email, "Welcome to TrichMind 💚", html, text);
        logger.info(`👋 Sent welcome email to ${user.email}`);

        res.status(201).json({
            ok: true,
            user: { id: user._id, email: user.email, displayName: user.displayName },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        logger.error(`❌ Registration error: ${err.message}`);
        res.status(400).json({ error: "ValidationError", details: err.errors || err.message });
    }
};

/* ─────────────────────────────────────────────────────────────
 * 🔑 Login Existing User
 * ───────────────────────────────────────────────────────────── */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = LoginDTO.parse(req.body);
        const user = await User.findOne({ email });

        if (!user || !(await user.compare(password))) {
            logger.warn(`❌ Invalid login attempt for: ${email}`);
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);
        logger.info(`🔑 User logged in: ${email}`);

        res.json({
            ok: true,
            user: { id: user._id, email: user.email, displayName: user.displayName },
            accessToken,
            refreshToken,
        });
    } catch (err: any) {
        logger.error(`❌ Login error: ${err.message}`);
        res.status(400).json({ error: err.message });
    }
};

/* ─────────────────────────────────────────────────────────────
 * ♻️ Refresh Access Token
 * ───────────────────────────────────────────────────────────── */
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: "Missing refresh token" });

        const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as any;
        const newAccessToken = jwt.sign({ sub: decoded.sub }, ENV.JWT_SECRET, { expiresIn: "15m" });

        res.json({ ok: true, accessToken: newAccessToken });
    } catch (err: any) {
        logger.warn(`⚠️ Invalid refresh token attempt`);
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

/* ─────────────────────────────────────────────────────────────
 * ✉️ Forgot Password — Send Reset Link
 * ───────────────────────────────────────────────────────────── */
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            logger.warn(`⚠️ Password reset requested for non-existent email: ${email}`);
            return res.json({ ok: true, message: "If the email exists, a reset link was sent." });
        }

        const resetToken = jwt.sign({ sub: user._id }, ENV.JWT_SECRET, { expiresIn: "15m" });
        const resetLink = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;

        // ✅ Send Reset Email via Template
        const { html, text } = buildResetPasswordEmail(resetLink, user.displayName);
        await sendMail(email, "Reset Your TrichMind Password", html, text);

        logger.info(`📧 Password reset link sent to ${email}`);
        res.json({ ok: true, message: "Password reset link sent." });
    } catch (err: any) {
        logger.error(`❌ Forgot password error: ${err.message}`);
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

        const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
        const user = await User.findById(decoded.sub);

        if (!user) return res.status(404).json({ error: "User not found" });

        user.password = newPassword;
        await user.save();

        logger.info(`🔒 Password reset for user: ${user.email}`);
        res.json({ ok: true, message: "Password updated successfully" });
    } catch (err: any) {
        logger.warn(`⚠️ Invalid or expired reset token`);
        res.status(400).json({ error: "Invalid or expired token" });
    }
};
