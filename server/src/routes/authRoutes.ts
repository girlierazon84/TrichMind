// server/src/routes/authRoutes.ts

import {
    Router,
    type Request,
    type Response,
    type NextFunction
} from "express";
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


// Create a new router instance
const router = Router();


/**-----------------------------------------------------------
    Dev-only debug logger for /register (redacts password)
--------------------------------------------------------------*/

// Middleware to log incoming /register requests in non-production environments
const debugRegisterLogger = (req: Request, _res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== "production") {
        const { password, ...rest } = req.body ?? {};
        // eslint-disable-next-line no-console
        console.log("🔥 [AUTH] /register incoming body (redacted):", {
            ...rest,
            password: password ? "[REDACTED]" : undefined,
        });
    }
    next();
};

/**----------------------------
    POST /api/auth/register
-------------------------------*/
router.post("/register", validate(RegisterSchema), debugRegisterLogger, register);

/**-------------------------
    POST /api/auth/login
----------------------------*/
router.post("/login", validate(LoginSchema), login);

/**---------------------------
    POST /api/auth/refresh
------------------------------*/
router.post("/refresh", refreshToken);

/**-----------------------------------
    POST /api/auth/forgot-password
--------------------------------------*/
router.post("/forgot-password", forgotPassword);

/**----------------------------------
    POST /api/auth/reset-password
-------------------------------------*/
router.post("/reset-password", resetPassword);

/**-----------------------------------
    POST /api/auth/change-password
--------------------------------------*/
router.post(
    "/change-password",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Extract old and new passwords from request body
        const { oldPassword, newPassword } = req.body ?? {};
        const userId = req.auth?.userId;

        // Validate presence of old and new passwords
        if (!oldPassword || !newPassword) {
            return res.status(400).json({
                ok: false,
                error: "BadRequest",
                message: "Missing old or new password",
            });
        }

        // Fetch user from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                error: "NotFound",
                message: "User not found",
            });
        }

        // Verify old password
        const match = await user.comparePassword(oldPassword);
        if (!match) {
            return res.status(400).json({
                ok: false,
                error: "InvalidCredentials",
                message: "Incorrect old password",
            });
        }

        // Update to new password
        user.password = newPassword;
        await user.save();

        return res.json({ ok: true, message: "Password updated!" });
    })
);

/**---------------------
    GET /api/auth/me
------------------------*/
router.get(
    "/me",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Extract user ID from authenticated request
        const userId = req.auth?.userId;

        // Fetch user details from database
        const dbUser = await User.findById(userId).select("-password").lean();
        if (!dbUser) {
            return res.status(404).json({
                ok: false,
                error: "NotFound",
                message: "User not found",
            });
        }

        // Normalize for frontend
        const anyUser = dbUser as any;

        // Respond with user details
        return res.json({
            ok: true,
            user: {
                id: anyUser._id?.toString?.() ?? anyUser._id,
                email: anyUser.email,
                displayName: anyUser.displayName,
                avatarUrl: anyUser.avatarUrl,
                date_of_birth: anyUser.date_of_birth,

                age: anyUser.age,
                age_of_onset: anyUser.age_of_onset,
                years_since_onset: anyUser.years_since_onset,

                pulling_severity: anyUser.pulling_severity,
                pulling_frequency_encoded: anyUser.pulling_frequency_encoded,
                awareness_level_encoded: anyUser.awareness_level_encoded,
                successfully_stopped_encoded: anyUser.successfully_stopped_encoded,
                how_long_stopped_days_est: anyUser.how_long_stopped_days_est,
                emotion: anyUser.emotion,

                coping_worked: anyUser.coping_worked ?? [],
                coping_not_worked: anyUser.coping_not_worked ?? [],
            },
        });
    })
);

export default router;
