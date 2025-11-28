// server/src/routes/userRoutes.ts

import { Router } from "express";
import { z } from "zod";
import { authentication } from "../middlewares";
import { User, HealthLog } from "../models";
import { asyncHandler } from "../utils";

/**-----------------------------
    🔹 Zod schema & helpers
--------------------------------*/
// Schema for updating user profile
const UpdateProfileSchema = z.object({
    displayName: z.string().trim().optional(),

    // Core numbers
    age: z.coerce.number().min(0).max(120).optional(),
    age_of_onset: z.coerce.number().min(0).max(120).optional(),
    years_since_onset: z.coerce.number().min(0).max(120).optional(),

    // Pulling behaviour
    pulling_severity: z.coerce.number().min(0).max(10).optional(),
    pulling_frequency: z.string().trim().optional(),
    pulling_awareness: z.string().trim().optional(),

    successfully_stopped: z.union([z.string().trim(), z.boolean()]).optional(),
    how_long_stopped_days: z.coerce.number().min(0).optional(),

    // Emotion & avatar
    emotion: z.string().trim().optional(),
    avatarUrl: z.string().trim().optional(),

    // Coping strategies – array or comma-separated string
    coping_worked: z
        .union([z.string().trim(), z.array(z.string().trim())])
        .optional(),
    coping_not_worked: z
        .union([z.string().trim(), z.array(z.string().trim())])
        .optional(),
});

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

/**--------------------
    🔹 User Routes
-----------------------*/
// Router instance
const router = Router();

/**------------------------------------------------------
    🟢 GET /api/users/profile — current user profile
---------------------------------------------------------*/
router.get(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const dbUser = await User.findById(req.auth!.userId)
            .select("-password")
            .lean();

        if (!dbUser) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }

        // Ensure coping arrays + id field for frontend
        const anyUser = dbUser as any;
        const { _id, ...rest } = anyUser;

        // Always send id + coping arrays to match client types
        const user = {
            id: _id?.toString?.() ?? _id,
            ...rest,
            coping_worked: anyUser.coping_worked ?? [],
            coping_not_worked: anyUser.coping_not_worked ?? [],
        };

        res.json({ ok: true, user });
    })
);

/**---------------------------------------------------------
    🩺 GET /api/users/health/latest — latest health log
------------------------------------------------------------*/
router.get(
    "/health/latest",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const log = await HealthLog.findOne({ userId: req.auth!.userId })
            .sort({ date: -1 })
            .lean();

        res.json({ ok: true, latest: log || {} });
    })
);

/**-------------------------------------------------------
    ✏️ PATCH /api/users/profile — update user profile
----------------------------------------------------------*/
router.patch(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

        // Validate input
        const parsed = UpdateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                ok: false,
                error: "Validation failed",
                issues: parsed.error.flatten(),
            });
        }

        // Extract validated data
        const data = parsed.data;

        // Coping strategies → normalized arrays
        const copingWorked = normalizeCoping(data.coping_worked);
        const copingNotWorked = normalizeCoping(data.coping_not_worked);

        // Prepare update object
        const update: Record<string, unknown> = {};

        // Simple scalars we accept directly
        const simpleKeys: (keyof typeof data)[] = [
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

        // Copy simple scalar fields directly
        for (const key of simpleKeys) {
            if (typeof data[key] !== "undefined") {
                update[key] = data[key] as any;
            }
        }

        // successfully_stopped & encoded flag
        if (typeof data.successfully_stopped !== "undefined") {
            const norm = normalizeStopped(data.successfully_stopped);
            if (typeof norm.raw !== "undefined") {
                update.successfully_stopped = norm.raw;
            }
            if (typeof norm.encoded === "boolean") {
                update.successfully_stopped_encoded = norm.encoded;
            }
        }

        // Derive how_long_stopped_days_est for heuristics & overview
        if (typeof data.how_long_stopped_days !== "undefined") {
            update.how_long_stopped_days_est = Math.max(0, data.how_long_stopped_days);
        }

        // Encoded pulling frequency values for ML
        if (typeof data.pulling_frequency !== "undefined") {
            const encFreq = encodePullingFrequency(data.pulling_frequency);
            if (typeof encFreq === "number") {
                update.pulling_frequency_encoded = encFreq;
            }
        }

        // Encoded pulling awareness values for ML
        if (typeof data.pulling_awareness !== "undefined") {
            const encAware = encodeAwareness(data.pulling_awareness);
            if (typeof encAware === "number") {
                update.awareness_level_encoded = encAware;
            }
        }

        // Coping strategies arrays
        if (typeof copingWorked !== "undefined") {
            update.coping_worked = copingWorked;
        }
        if (typeof copingNotWorked !== "undefined") {
            update.coping_not_worked = copingNotWorked;
        }

        // Update user in DB
        const updated = await User.findByIdAndUpdate(userId, update, {
            new: true,
        })
            .select("-password")
            .lean();

        // Not found
        if (!updated) {
            return res.status(404).json({ ok: false, error: "User not found" });
        }

        // Ensure coping arrays + id field for frontend
        const anyUser = updated as any;
        const { _id, ...rest } = anyUser;

        // Always send id + coping arrays to match client types
        const user = {
            id: _id?.toString?.() ?? _id,
            ...rest,
            coping_worked: anyUser.coping_worked ?? [],
            coping_not_worked: anyUser.coping_not_worked ?? [],
        };

        res.json({ ok: true, user });
    })
);

/**--------------------------------------------------
    🗑️ DELETE /api/users/delete — delete account
-----------------------------------------------------*/
router.delete(
    "/delete",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        await User.findByIdAndDelete(req.auth!.userId);
        return res.json({ ok: true, message: "Account deleted" });
    })
);

export default router;
