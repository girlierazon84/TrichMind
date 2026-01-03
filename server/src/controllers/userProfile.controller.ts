// server/src/controllers/userProfile.controller.ts

import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/UserModel";


// Extended Request type with auth info
type AuthRequest = Request & { auth?: { userId: string } };

// Zod schema for validating update profile request body
const csvOrArray = z.preprocess((v) => {
    // Convert CSV string to array
    if (v === undefined || v === null) return undefined;
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return v.split(",").map((s) => s.trim()).filter(Boolean);
    return undefined;
}, z.array(z.string().trim().min(1))).optional();

// Define the schema for profile updates
const UpdateProfileSchema = z
    .object({
        displayName: z.string().trim().optional(),
        age: z.coerce.number().min(0).max(120).optional(),
        age_of_onset: z.coerce.number().min(0).max(120).optional(),
        years_since_onset: z.coerce.number().min(0).max(120).optional(),

        pulling_severity: z.coerce.number().min(0).max(10).optional(),
        pulling_frequency: z.string().trim().optional(),
        pulling_awareness: z.string().trim().optional(),

        successfully_stopped: z.union([z.boolean(), z.string().trim()]).optional(),
        how_long_stopped_days: z.coerce.number().min(0).optional(),

        emotion: z.string().trim().optional(),
        avatarUrl: z.string().trim().optional(),

        coping_worked: csvOrArray,
        coping_not_worked: csvOrArray,
    })
    .strict();

// Helper functions to encode certain fields
function encodePullingFrequency(raw?: string): number | undefined {
    // Encode pulling frequency to numeric values
    if (!raw) return undefined;
    // Normalize input
    const v = raw.trim().toLowerCase();
    if (v.includes("daily") || v.includes("every day") || v.includes("day")) return 5;
    if (v.includes("several") && v.includes("week")) return 4;
    if (v.includes("week")) return 3;
    if (v.includes("month")) return 2;
    if (v.includes("rare")) return 1;
    return 0;
}

// Encode awareness levels to numeric values
function encodeAwareness(raw?: string): number | undefined {
    // Encode awareness to numeric values
    if (!raw) return undefined;
    // Normalize input
    const v = raw.trim().toLowerCase();
    if (v === "no" || v.includes("unaware")) return 0;
    if (v.includes("sometimes")) return 0.5;
    if (v === "yes" || v.includes("aware")) return 1;
    return 0.5;
}

// Normalize successfully_stopped field
function normalizeStopped(raw?: string | boolean): { raw?: string | boolean; encoded?: boolean } {
    // Normalize successfully_stopped input
    if (typeof raw === "boolean") return { raw, encoded: raw };
    if (typeof raw === "string") {
        // Normalize input
        const v = raw.trim().toLowerCase();
        if (["1", "true", "yes", "y"].includes(v)) return { raw: "yes", encoded: true };
        if (["0", "false", "no", "n"].includes(v)) return { raw: "no", encoded: false };
        return { raw };
    }
    return {};
}

/**-----------------------------
    PATCH /api/users/profile
--------------------------------*/
export async function updateProfile(req: AuthRequest, res: Response) {
    // Update user profile controller
    try {
        // Ensure user is authenticated
        const userId = req.auth?.userId;
        if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

        // Validate request body
        const parsed = UpdateProfileSchema.safeParse(req.body);
        // Handle validation errors
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "ValidationError",
                issues: parsed.error.flatten(),
            });
        }

        // Build update object
        const data = parsed.data;
        const update: Record<string, unknown> = {};

        // scalar fields
        const scalarKeys: (keyof typeof data)[] = [
            "displayName",
            "age",
            "age_of_onset",
            "years_since_onset",
            "pulling_severity",
            "pulling_frequency",
            "pulling_awareness",
            "how_long_stopped_days",
            "emotion",
            "avatarUrl",
        ];

        // Copy scalar fields if defined
        for (const k of scalarKeys) {
            // Only include defined fields
            if (data[k] !== undefined) update[k] = data[k] as any;
        }

        // stopped raw + encoded
        if (data.successfully_stopped !== undefined) {
            // Normalize successfully_stopped field
            const s = normalizeStopped(data.successfully_stopped);
            // Set raw and encoded values if available
            if (s.raw !== undefined) update.successfully_stopped = s.raw;
            if (typeof s.encoded === "boolean") update.successfully_stopped_encoded = s.encoded;
        }

        // derived estimates/encodings
        if (data.how_long_stopped_days !== undefined) {
            // Ensure non-negative value
            update.how_long_stopped_days_est = Math.max(0, data.how_long_stopped_days);
        }
        if (data.pulling_frequency !== undefined) {
            // Encode pulling frequency
            const enc = encodePullingFrequency(data.pulling_frequency);
            if (typeof enc === "number") update.pulling_frequency_encoded = enc;
        }
        if (data.pulling_awareness !== undefined) {
            // Encode pulling awareness
            const enc = encodeAwareness(data.pulling_awareness);
            if (typeof enc === "number") update.awareness_level_encoded = enc;
        }

        // coping arrays
        if (data.coping_worked !== undefined) update.coping_worked = data.coping_worked;
        if (data.coping_not_worked !== undefined) update.coping_not_worked = data.coping_not_worked;

        // Perform the update in the database
        const updated = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
        // Handle case where user is not found
        if (!updated) return res.status(404).json({ ok: false, error: "UserNotFound" });

        // Return the updated user profile
        const { _id, ...rest } = updated as any;
        return res.json({ ok: true, user: { id: _id.toString(), ...rest } });
    } catch (err: any) {
        // Log and handle unexpected errors
        console.error("[updateProfile] Error:", err);
        return res.status(500).json({ ok: false, error: "UpdateFailed", message: err?.message || "Failed to update profile" });
    }
}
