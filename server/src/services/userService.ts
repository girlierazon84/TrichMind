// server/src/services/userService.ts

import { User, IUser } from "../models";
import { RegisterDTO, LoginDTO } from "../schemas";
import { loggerService } from "./loggerService";

/**------------------------------------------------------
    Safe logger wrapper – never blocks main flow
    (only for methods shaped like (msg, context?))
-------------------------------------------------------*/
type SimpleLoggerMethod = (
    message: string,
    context?: Record<string, unknown>
) => unknown;

type SafeLogKey = {
    [K in keyof typeof loggerService]: typeof loggerService[K] extends SimpleLoggerMethod
        ? K
        : never;
}[keyof typeof loggerService];

function safeLog(
    fn: SafeLogKey,
    message: string,
    context?: Record<string, unknown>
) {
    try {
        const loggerFn = loggerService[fn] as SimpleLoggerMethod;
        if (typeof loggerFn === "function") {
            // fire-and-forget: we don't await logging
            void loggerFn(message, context);
        }
    } catch (err) {
        // As a last resort, log to console but never throw
        console.error("[userService] logger error:", err);
    }
}

/**------------------------------------------------------
    Helpers – keep in sync with userRoutes.ts
-------------------------------------------------------*/

// Normalize coping strategies into arrays
function normalizeCoping(raw?: string | string[]): string[] | undefined {
    if (typeof raw === "undefined") return undefined;
    if (Array.isArray(raw)) {
        return raw.map((s) => s.trim()).filter(Boolean);
    }
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

// Encode pulling frequency into a numeric scale
function encodePullingFrequency(raw?: string): number | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toLowerCase();

    if (v.includes("daily") || v.includes("every day")) return 5;
    if (v.includes("several") || v.includes("times a week") || v.includes("few"))
        return 4;
    if (v.includes("weekly") || v.includes("once a week")) return 3;
    if (v.includes("monthly") || v.includes("once a month")) return 2;
    if (v.includes("rare")) return 1;

    return 0; // unknown / other
}

// Encode pulling awareness into a numeric scale
function encodeAwareness(raw?: string): number | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toLowerCase();

    if (v.includes("no") || v.includes("unaware")) return 0;
    if (v.includes("sometimes") || v.includes("mixed")) return 0.5;
    if (v.includes("yes") || v.includes("aware")) return 1;

    return 0.5; // fallback medium
}

// Normalize successfully_stopped field
function normalizeStopped(
    raw: string | boolean | undefined
): { raw?: string | boolean; encoded?: boolean } {
    if (typeof raw === "boolean") {
        return { raw, encoded: raw };
    }

    if (typeof raw === "string") {
        const v = raw.trim().toLowerCase();
        if (["yes", "y", "true"].includes(v)) {
            return { raw: "yes", encoded: true };
        }
        if (["no", "n", "false"].includes(v)) {
            return { raw: "no", encoded: false };
        }
        // unknown string → keep but don't encode
        return { raw };
    }

    return {};
}

/**-----------------------------------------------------------------------
    💡 User Service
    Handles user registration, login, profile management, and deletion.
--------------------------------------------------------------------------**/
export const userService = {
    // 🆕 Register a new user
    async register(data: RegisterDTO): Promise<IUser> {
        const email = data.email.toLowerCase();

        // Check if the email is already registered
        const existing = await User.findOne({ email });
        if (existing) {
            throw new Error("Email already registered");
        }

        // 🔁 Normalize / derive extra fields (aligned with profile & ML logic)
        const copingWorked = normalizeCoping(data.coping_worked);
        const copingNotWorked = normalizeCoping(data.coping_not_worked);

        const stoppedNorm = normalizeStopped(data.successfully_stopped);
        const encFreq = encodePullingFrequency(data.pulling_frequency);
        const encAware = encodeAwareness(data.pulling_awareness);

        const howLongStopped =
            typeof data.how_long_stopped_days === "number"
                ? Math.max(0, data.how_long_stopped_days)
                : undefined;

        // Prepare payload for User model
        const userPayload: Partial<IUser> = {
            email,
            password: data.password,
            displayName: data.displayName?.trim(),

            // Dates & core metrics
            date_of_birth: data.date_of_birth
                ? new Date(data.date_of_birth)
                : undefined,
            age: typeof data.age === "number" ? data.age : undefined,
            age_of_onset:
                typeof data.age_of_onset === "number"
                    ? data.age_of_onset
                    : undefined,
            years_since_onset:
                typeof data.years_since_onset === "number"
                    ? data.years_since_onset
                    : undefined,

            // Raw behaviour fields
            pulling_severity: data.pulling_severity,
            pulling_frequency: data.pulling_frequency,
            pulling_awareness: data.pulling_awareness,
            successfully_stopped: stoppedNorm.raw,
            how_long_stopped_days: data.how_long_stopped_days,

            // Encoded fields for ML / overview
            pulling_frequency_encoded:
                typeof encFreq === "number" ? encFreq : undefined,
            awareness_level_encoded:
                typeof encAware === "number" ? encAware : undefined,
            successfully_stopped_encoded: stoppedNorm.encoded,
            how_long_stopped_days_est: howLongStopped,

            // Emotion & coping
            emotion: data.emotion,
            coping_worked: copingWorked,
            coping_not_worked: copingNotWorked,
        };

        // Create and save the new user
        const user = await User.create(userPayload);

        // Log the registration event (non-blocking)
        safeLog("logInfo", "New user registered", {
            userId: user._id,
            email: user.email,
            category: "auth",
        });

        return user;
    },

    // 🔐 User login
    async login(data: LoginDTO): Promise<IUser> {
        const email = data.email.toLowerCase();

        // Validate input data
        const user = await User.findOne({ email });
        if (!user) {
            safeLog("logError", "Login attempt with invalid email", {
                email: data.email,
                category: "auth",
            });
            throw new Error("Invalid email or password");
        }

        // Check if the password is valid
        const valid = await user.compare(data.password);
        if (!valid) {
            safeLog("logError", "Invalid password attempt", {
                email: data.email,
                category: "auth",
            });
            throw new Error("Invalid email or password");
        }

        // Log the successful login
        safeLog("logInfo", "User logged in", {
            userId: user._id,
            email: user.email,
            category: "auth",
        });

        return user;
    },

    // 🔍 Get user by ID
    async getById(id: string): Promise<IUser | null> {
        const user = await User.findById(id);
        if (!user) {
            safeLog("logError", "User not found", {
                userId: id,
                category: "auth",
            });
            return null;
        }
        return user;
    },

    // 🔍 Find user by email
    async findByEmail(email: string): Promise<IUser | null> {
        const lower = email.toLowerCase();
        const user = await User.findOne({ email: lower });

        if (!user) {
            safeLog("logError", "User not found by email", {
                email: lower,
                category: "auth",
            });
            return null;
        }
        return user;
    },

    // ✏️ Update user profile
    // (currently used mainly for password reset – richer profile update logic lives in userRoutes)
    async updateProfile(
        userId: string,
        data: Partial<RegisterDTO>
    ): Promise<IUser | null> {
        const updated = await User.findByIdAndUpdate(userId, data, {
            new: true,
        });

        if (!updated) {
            safeLog("logError", "Profile update failed: user not found", {
                userId,
                category: "auth",
            });
            return null;
        }

        safeLog("logInfo", "User profile updated", {
            userId,
            category: "auth",
        });
        return updated;
    },

    // ❌ Delete user account
    async deleteUser(userId: string): Promise<IUser | null> {
        const deleted = await User.findByIdAndDelete(userId);

        if (!deleted) {
            safeLog("logError", "Delete user failed: user not found", {
                userId,
                category: "auth",
            });
            return null;
        }

        safeLog("logInfo", "User account deleted", {
            userId,
            category: "auth",
        });
        return deleted;
    },
};

export default userService;
