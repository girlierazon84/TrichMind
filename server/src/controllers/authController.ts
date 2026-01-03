// server/src/controllers/authController.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { ENV } from "../config";
import type { RegisterDTO, LoginDTO } from "../schemas";
import { sendMail, asyncHandler } from "../utils";
import { buildWelcomeEmail, buildResetPasswordEmail } from "../templates";

// ✅ new structure: import services directly (not from "../services" barrel)
import { userService } from "../services/userService";
import { loggerService } from "../services/loggerService";
import type { ILogEvent } from "../models";


/**---------------------------------
    Logger helpers (never throw)
------------------------------------*/
type LogCategory = ILogEvent["category"];
const AUTH_CATEGORY: LogCategory = "auth";

/**--------------------------------------------
    Safe logging functions that never throw
-----------------------------------------------*/

// Logging info safely without throwing errors
function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: LogCategory = AUTH_CATEGORY
) {
    // Wrap in try-catch to prevent logging failures from affecting main flow
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch {
        // never throw
    }
}

// Logging warnings safely without throwing errors
function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: LogCategory = AUTH_CATEGORY
) {
    // Wrap in try-catch to prevent logging failures from affecting main flow
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch {
        // never throw
    }
}

// Logging errors safely without throwing errors
function safeLogError(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: LogCategory = AUTH_CATEGORY
) {
    // Wrap in try-catch to prevent logging failures from affecting main flow
    try {
        void loggerService.logError(message, context, category, userId);
    } catch {
        // never throw
    }
}

/**----------------------------------
    Secrets (with safe fallbacks)
-------------------------------------*/
// JWT secrets from ENV or process.env
function getJwtSecret(): string | undefined {
    return ENV.JWT_SECRET ?? process.env.JWT_SECRET;
}
// JWT refresh secret from ENV or process.env
function getJwtRefreshSecret(): string | undefined {
    return ENV.JWT_REFRESH_SECRET ?? process.env.JWT_REFRESH_SECRET;
}
// Client base URL from ENV or process.env
function getClientBaseUrl(): string {
    const raw = ENV.CLIENT_URL ?? process.env.CLIENT_URL ?? "";
    return raw.replace(/\/$/, "");
}

/**-----------------------------------------------
    🔐 Generate JWT Access and Refresh Tokens
--------------------------------------------------*/
export const generateTokens = (userId: string) => {
    // Ensure secrets are available
    const jwtSecret = getJwtSecret();
    const refreshSecret = getJwtRefreshSecret();
    // Throw error if secrets are missing
    if (!jwtSecret || !refreshSecret) {
        throw new Error("JWT secrets are not configured on the server.");
    }

    // Generate access and refresh tokens
    const accessToken = jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ sub: userId }, refreshSecret, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

/**----------------------------
    📝 Register a new user
-------------------------------*/
export const register = asyncHandler(async (req: Request, res: Response) => {
    // Registration logic
    try {
        // Extract and validate registration data
        const data = req.body as RegisterDTO; // validated by validate(RegisterSchema)
        const user = await userService.register(data);

        // Generate JWT tokens
        const userId = user._id.toString();
        const { accessToken, refreshToken } = generateTokens(userId);

        // Log successful registration
        res.status(201).json({
            ok: true,
            token: accessToken,
            refreshToken,
            user: {
                id: userId,
                email: user.email,
                displayName: user.displayName,
            },
        });

        // fire-and-forget welcome email
        void (async () => {
            // Build welcome email content
            try {
                // ✅ updated template API (single object argument)
                const baseUrl = getClientBaseUrl();
                const loginUrl = `${baseUrl}/login`;
                const { html, text } = buildWelcomeEmail({
                    displayName: user.displayName,
                    loginUrl,
                });

                // ✅ updated mailer API (single-argument call)
                await sendMail({
                    to: user.email,
                    subject: "Welcome to TrichMind 💚",
                    html,
                    text,
                } as any);

                // Log successful email sending
                safeLogInfo("Welcome email sent", { email: user.email }, userId);
            } catch (err: any) {
                // Log email sending failure without affecting registration flow
                safeLogError(
                    "Welcome email failed",
                    { email: user.email, error: err?.message ?? String(err) },
                    userId
                );
            }
        })();
    } catch (err: any) {
        // Log registration failure
        safeLogError("Registration error", { error: err?.message ?? String(err) });
        return res.status(400).json({
            ok: false,
            error: "RegistrationFailed",
            message: err?.message || "Registration failed",
        });
    }
});

/**-------------------
    🔐 User login
----------------------*/
export const login = asyncHandler(async (req: Request, res: Response) => {
    // Login logic
    try {
        // Extract and validate login credentials
        const credentials = req.body as LoginDTO; // validated by validate(LoginSchema)
        const user = await userService.login(credentials);

        // Generate JWT tokens
        const userId = user._id.toString();
        const { accessToken, refreshToken } = generateTokens(userId);

        // Log successful login
        safeLogInfo("User logged in", { email: user.email }, userId);

        // Respond with tokens and user info
        return res.json({
            ok: true,
            token: accessToken,
            refreshToken,
            user: {
                id: userId,
                email: user.email,
                displayName: user.displayName,
            },
        });
    } catch (err: any) {
        // Log failed login attempt
        safeLogWarn("Invalid login attempt", {
            email: (req.body as any)?.email,
            error: err?.message ?? String(err),
        });

        // Respond with unauthorized error
        return res.status(401).json({
            ok: false,
            error: "InvalidCredentials",
            message: err?.message || "Invalid credentials",
        });
    }
});

/**-----------------------------
    🔄 Refresh Access Token
--------------------------------*/
const RefreshSchema = z
    .object({
        token: z.string().optional(),
        refreshToken: z.string().optional(),
    })
    .strict();

// Refresh token logic
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Token refresh logic
    try {
        // Validate request body
        const parsed = RefreshSchema.safeParse(req.body);
        // Handle validation errors
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }

        // Extract refresh token from request
        const token = parsed.data.refreshToken || parsed.data.token;
        // Handle missing token
        if (!token) {
            return res.status(400).json({ ok: false, error: "MissingRefreshToken" });
        }

        // Verify refresh token
        const refreshSecret = getJwtRefreshSecret();
        const jwtSecret = getJwtSecret();
        // Handle missing secrets
        if (!refreshSecret || !jwtSecret) {
            return res.status(500).json({
                ok: false,
                error: "ServerMisconfigured",
                message: "JWT secrets are not configured on the server.",
            });
        }

        // Decode and verify the token
        const decoded = jwt.verify(token, refreshSecret) as { sub: string };
        const newAccessToken = jwt.sign({ sub: decoded.sub }, jwtSecret, {
            expiresIn: "15m",
        });

        // Log successful token refresh
        safeLogInfo("Access token refreshed", { userId: decoded.sub }, decoded.sub);
        return res.json({ ok: true, token: newAccessToken });
    } catch (err: any) {
        // Log invalid refresh token attempt
        safeLogWarn("Invalid refresh token attempt", { error: err?.message ?? String(err) });

        // Respond with forbidden error
        return res.status(403).json({
            ok: false,
            error: "InvalidRefreshToken",
            message: "Invalid or expired refresh token",
        });
    }
});

/**------------------------
    🔒 Forgot Password
---------------------------*/
const ForgotSchema = z.object({ email: z.string().email() }).strict();

// Forgot password logic
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    // Password reset logic
    try {
        // Validate request body
        const parsed = ForgotSchema.safeParse(req.body);
        // Handle validation errors
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }

        // Find user by email
        const { email } = parsed.data;
        const user = await userService.findByEmail(email);

        // avoid account enumeration
        if (!user) {
            safeLogWarn("Password reset requested for non-existent email", { email });
            return res.json({
                ok: true,
                message: "If the email exists, a reset link was sent.",
            });
        }

        // Generate password reset token
        const jwtSecret = getJwtSecret();
        // Handle missing JWT secret
        if (!jwtSecret) {
            return res.status(500).json({
                ok: false,
                error: "ServerMisconfigured",
                message: "JWT secret is not configured on the server.",
            });
        }

        // Create reset token valid for 15 minutes
        const resetToken = jwt.sign({ sub: user._id.toString() }, jwtSecret, {
            expiresIn: "15m",
        });

        // Build reset password email content
        const baseUrl = getClientBaseUrl();
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        // ✅ updated template API (single object argument)
        const { html, text } = buildResetPasswordEmail({
            resetLink,
            displayName: user.displayName,
        });

        // ✅ updated mailer API (single-argument call)
        await sendMail({
            to: user.email,
            subject: "Reset Your TrichMind Password",
            html,
            text,
        } as any);

        // Log successful password reset email sending
        safeLogInfo("Password reset email sent", { email: user.email }, user._id.toString());
        return res.json({
            ok: true,
            message: "If the email exists, a reset link was sent.",
        });
    } catch (err: any) {
        // Log failure to send password reset email
        safeLogError("Forgot password error", { error: err?.message ?? String(err) });
        return res.status(500).json({
            ok: false,
            error: "ResetEmailFailed",
            message: "Failed to send password reset email",
        });
    }
});

/**-----------------------
    🔑 Reset Password
--------------------------*/
const ResetSchema = z
    .object({
        token: z.string().min(1),
        newPassword: z.string().min(6),
    })
    .strict();

// Reset password logic
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    // Password reset logic
    try {
        // Validate request body
        const parsed = ResetSchema.safeParse(req.body);
        // Handle validation errors
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                details: parsed.error.flatten(),
            });
        }

        // Verify reset token
        const { token, newPassword } = parsed.data;

        // Ensure JWT secret is available
        const jwtSecret = getJwtSecret();
        // Handle missing JWT secret
        if (!jwtSecret) {
            return res.status(500).json({
                ok: false,
                error: "ServerMisconfigured",
                message: "JWT secret is not configured on the server.",
            });
        }

        // Decode and verify the token
        const decoded = jwt.verify(token, jwtSecret) as { sub: string };

        // Find user by ID from token
        const user = await userService.getById(decoded.sub);
        // Handle user not found
        if (!user) {
            return res.status(404).json({ ok: false, error: "UserNotFound" });
        }

        // IMPORTANT: findByIdAndUpdate bypasses pre-save hooks; hash manually
        const hashed = await bcrypt.hash(newPassword, 10);
        await userService.updateProfile(user._id.toString(), { password: hashed as any });

        // Log successful password reset
        safeLogInfo(
            "Password reset successful",
            { userId: user._id.toString() },
            user._id.toString()
        );

        // Respond with success message
        return res.json({ ok: true, message: "Password updated successfully" });
    } catch (err: any) {
        // Log invalid or expired reset token attempt
        safeLogWarn("Invalid or expired reset token", { error: err?.message ?? String(err) });
        return res
            .status(400)
            .json({ ok: false, error: "InvalidToken", message: "Invalid or expired token" });
    }
});

export default {
    register,
    login,
    refreshToken,
    forgotPassword,
    resetPassword,
};
