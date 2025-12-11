// server/src/controllers/authController.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { ENV } from "../config";
import type { RegisterDTO, LoginDTO } from "../schemas";
import { sendMail } from "../utils";
import { buildWelcomeEmail, buildResetPasswordEmail } from "../templates";
import { loggerService, userService } from "../services";


/**-----------------------------------------------
    🔐 Generate JWT Access and Refresh Tokens
--------------------------------------------------*/
export const generateTokens = (userId: string) => {
    const accessToken = jwt.sign({ sub: userId }, ENV.JWT_SECRET, {
        expiresIn: "15m",
    });
    const refreshToken = jwt.sign(
        { sub: userId },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
};

/**---------------------------
    📝 Register a new user
    - Responds quickly
    - Sends welcome email in background
------------------------------*/
export const register = async (req: Request, res: Response) => {
    try {
        const data = req.body as RegisterDTO; // already validated by middleware
        const user = await userService.register(data);

        const { accessToken, refreshToken } = generateTokens(
            user._id.toString()
        );

        // ✅ Respond immediately to the client
        res.status(201).json({
            token: accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
            },
        });

        // 📧 Fire-and-forget welcome email
        (async () => {
            try {
                const { html, text } = buildWelcomeEmail(user.displayName);
                await sendMail(
                    user.email,
                    "Welcome to TrichMind 💚",
                    html,
                    text
                );

                await loggerService.logInfo("Welcome email sent", {
                    userId: user._id.toString(),
                    email: user.email,
                });
            } catch (err: any) {
                await loggerService.logError("❌ Welcome email send failed", {
                    userId: user._id.toString(),
                    email: user.email,
                    error: err.message,
                });
            }
        })();
    } catch (err: any) {
        await loggerService.logError("❌ Registration error", {
            error: err.message,
        });
        res.status(400).json({ error: err.message || "Registration failed" });
    }
};

/**------------------
    🔐 User login
---------------------*/
export const login = async (req: Request, res: Response) => {
    try {
        const credentials = req.body as LoginDTO; // validated by middleware
        const user = await userService.login(credentials);

        const { accessToken, refreshToken } = generateTokens(
            user._id.toString()
        );

        await loggerService.logInfo("User logged in", {
            userId: user._id.toString(),
            email: user.email,
        });

        res.json({
            token: accessToken,
            refreshToken,
            user: {
                id: user._id.toString(),
                email: user.email,
                displayName: user.displayName,
            },
        });
    } catch (err: any) {
        await loggerService.log(
            "Invalid login attempt",
            "warning",
            "auth",
            { email: req.body.email }
        );
        res.status(401).json({ error: err.message || "Invalid credentials" });
    }
};

/**-----------------------------
    🔄 Refresh Access Token
--------------------------------*/
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token)
            return res
                .status(400)
                .json({ error: "Missing refresh token" });

        const decoded = jwt.verify(
            token,
            ENV.JWT_REFRESH_SECRET
        ) as { sub: string };
        const newAccessToken = jwt.sign(
            { sub: decoded.sub },
            ENV.JWT_SECRET,
            { expiresIn: "15m" }
        );

        await loggerService.logInfo("Access token refreshed", {
            userId: decoded.sub,
        });

        res.json({ token: newAccessToken });
    } catch (err: any) {
        await loggerService.log(
            "Invalid refresh token attempt",
            "warning",
            "auth"
        );
        res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};

/**------------------------
    🔒 Forgot Password
---------------------------*/
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await userService.findByEmail(email);

        if (!user) {
            await loggerService.log(
                "Password reset requested for non-existent email",
                "warning",
                "auth",
                { email }
            );
            return res.json({
                ok: true,
                message:
                    "If the email exists, a reset link was sent.",
            });
        }

        const resetToken = jwt.sign(
            { sub: user._id.toString() },
            ENV.JWT_SECRET,
            { expiresIn: "15m" }
        );
        const resetLink = `${ENV.CLIENT_URL}/reset-password?token=${resetToken}`;

        const { html, text } = buildResetPasswordEmail(
            resetLink,
            user.displayName
        );
        await sendMail(
            user.email,
            "Reset Your TrichMind Password",
            html,
            text
        );

        await loggerService.logInfo("Password reset email sent", {
            email: user.email,
        });
        res.json({ ok: true, message: "Password reset link sent." });
    } catch (err: any) {
        await loggerService.logError("Forgot password error", {
            error: err.message,
        });
        res.status(500).json({
            error: "Failed to send password reset email",
        });
    }
};

/**-----------------------
    🔑 Reset Password
--------------------------*/
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res
                .status(400)
                .json({ error: "Token and new password required" });
        }

        const decoded = jwt.verify(
            token,
            ENV.JWT_SECRET
        ) as { sub: string };
        const user = await userService.getById(decoded.sub);

        if (!user) return res.status(404).json({ error: "User not found" });

        const hashed = await bcrypt.hash(newPassword, 10);
        await userService.updateProfile(user._id.toString(), {
            password: hashed as any,
        });

        await loggerService.logInfo("Password reset successful", {
            userId: user._id.toString(),
        });
        res.json({ ok: true, message: "Password updated successfully" });
    } catch (err: any) {
        await loggerService.log(
            "Invalid or expired reset token",
            "warning",
            "auth"
        );
        res.status(400).json({ error: "Invalid or expired token" });
    }
};

export default {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
};
