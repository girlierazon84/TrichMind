// server/src/services/userService.ts

import { User } from "../models";
import type { IUser, UserDocument } from "../models";
import type { RegisterDTO, LoginDTO } from "../schemas";
import { loggerService } from "./loggerService";


/**----------------------------------------------------
    fire-and-forget logger (never blocks main flow)
-------------------------------------------------------*/
function safeLog(
    level: "info" | "warning" | "error",
    message: string,
    context: Record<string, unknown>,
    userId?: string
) {
    try {
        if (level === "info") void loggerService.logInfo(message, context, "auth", userId);
        if (level === "warning") void loggerService.logWarning(message, context, "auth", userId);
        if (level === "error") void loggerService.logError(message, context, "auth", userId);
    } catch {
        // never throw from logging
    }
}

/**------------
    helpers
---------------*/

// Normalize coping strategies input into array of strings
function normalizeCoping(raw?: string | string[]): string[] | undefined {
    if (typeof raw === "undefined") return undefined;
    if (Array.isArray(raw)) return raw.map((s) => s.trim()).filter(Boolean);
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// Encode pulling frequency into a numeric scale
function encodePullingFrequency(raw?: string): number | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toLowerCase();
    if (v.includes("daily") || v.includes("every day")) return 5;
    if (v.includes("several") || v.includes("times a week") || v.includes("few")) return 4;
    if (v.includes("weekly") || v.includes("once a week")) return 3;
    if (v.includes("monthly") || v.includes("once a month")) return 2;
    if (v.includes("rare")) return 1;
    return 0;
}

// Encode pulling awareness into a numeric scale
function encodeAwareness(raw?: string): number | undefined {
    if (!raw) return undefined;
    const v = raw.trim().toLowerCase();
    if (v.includes("no") || v.includes("unaware")) return 0;
    if (v.includes("sometimes") || v.includes("mixed")) return 0.5;
    if (v.includes("yes") || v.includes("aware")) return 1;
    return 0.5;
}

// Normalize successfully stopped input
function normalizeStopped(raw: string | boolean | undefined): {
    raw?: string | boolean;
    encoded?: boolean;
} {
    if (typeof raw === "boolean") return { raw, encoded: raw };
    if (typeof raw === "string") {
        const v = raw.trim().toLowerCase();
        if (["yes", "y", "true"].includes(v)) return { raw: "yes", encoded: true };
        if (["no", "n", "false"].includes(v)) return { raw: "no", encoded: false };
        return { raw };
    }
    return {};
}

/**-----------------
    User Service
--------------------*/

// Service for user registration, login, and profile management
export const userService = {
    // Register a new user
    async register(data: RegisterDTO): Promise<UserDocument> {
        const email = data.email.toLowerCase();

        // Check if email is already registered
        const existing = await User.findOne({ email }).maxTimeMS(5000).exec();
        if (existing) throw new Error("Email already registered");

        // Process and normalize optional fields
        const copingWorked = normalizeCoping(data.coping_worked);
        const copingNotWorked = normalizeCoping(data.coping_not_worked);

        // Normalize and encode other fields
        const stoppedNorm = normalizeStopped(data.successfully_stopped);
        const encFreq = encodePullingFrequency(data.pulling_frequency);
        const encAware = encodeAwareness(data.pulling_awareness);

        // Estimate how long stopped in days
        const howLongStoppedEst =
            typeof data.how_long_stopped_days === "number"
                ? Math.max(0, data.how_long_stopped_days)
                : undefined;

        // Prepare user payload
        const userPayload: Partial<IUser> = {
            email,
            password: data.password,
            displayName: data.displayName?.trim(),

            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
            age: typeof data.age === "number" ? data.age : undefined,
            age_of_onset: typeof data.age_of_onset === "number" ? data.age_of_onset : undefined,
            years_since_onset: typeof data.years_since_onset === "number" ? data.years_since_onset : undefined,

            pulling_severity: data.pulling_severity,
            pulling_frequency: data.pulling_frequency,
            pulling_awareness: data.pulling_awareness,
            successfully_stopped: stoppedNorm.raw,
            how_long_stopped_days: data.how_long_stopped_days,

            pulling_frequency_encoded: encFreq,
            awareness_level_encoded: encAware,
            successfully_stopped_encoded: stoppedNorm.encoded,
            how_long_stopped_days_est: howLongStoppedEst,

            emotion: data.emotion,
            coping_worked: copingWorked,
            coping_not_worked: copingNotWorked,
        };

        // ensure TS sees a single doc
        const user = (await User.create(userPayload)) as UserDocument;

        // Log registration event
        safeLog("info", "New user registered", { email }, user._id.toString());
        return user;
    },

    // User login
    async login(data: LoginDTO): Promise<UserDocument> {
        // Find user by email
        const email = data.email.toLowerCase();
        const user = (await User.findOne({ email }).maxTimeMS(5000).exec()) as UserDocument | null;

        // If user not found, log and throw error
        if (!user) {
            // Log invalid email attempt
            safeLog("warning", "Login attempt with invalid email", { email: data.email });
            throw new Error("Invalid email or password");
        }

        // Verify password
        const valid = await user.compare(data.password);
        // If password invalid, log and throw error
        if (!valid) {
            // Log invalid password attempt
            safeLog("warning", "Invalid password attempt", { email: data.email }, user._id.toString());
            throw new Error("Invalid email or password");
        }

        // Log successful login
        safeLog("info", "User logged in", { email: user.email }, user._id.toString());
        return user;
    },

    // Get user by ID
    async getById(id: string): Promise<UserDocument | null> {
        return User.findById(id).exec() as Promise<UserDocument | null>;
    },

    // Find user by email
    async findByEmail(email: string): Promise<UserDocument | null> {
        return User.findOne({ email: email.toLowerCase() }).exec() as Promise<UserDocument | null>;
    },

    // Update user profile
    async updateProfile(userId: string, data: Partial<IUser>): Promise<UserDocument | null> {
        // Update user document
        const updated = await User.findByIdAndUpdate(userId, data, { new: true }).exec();
        // If user not found, log and return null
        if (!updated) {
            // Log update failure
            safeLog("error", "Profile update failed: user not found", { userId }, userId);
            return null;
        }
        // Log successful update
        safeLog("info", "User profile updated", { userId }, userId);
        return updated as UserDocument;
    },

    // Delete user account
    async deleteUser(userId: string): Promise<UserDocument | null> {
        // Delete user document
        const deleted = await User.findByIdAndDelete(userId).exec();
        // If user not found, log and return null
        if (!deleted) {
            safeLog("error", "Delete user failed: user not found", { userId }, userId);
            return null;
        }
        // Log successful deletion
        safeLog("info", "User account deleted", { userId }, userId);
        return deleted as UserDocument;
    },
};

export default userService;
