// server/src/schemas/userSchema.ts

import { z } from "zod";

/**------------------------------------------------------
    🔐 User registration schema
    Aligned with authController & User Mongoose model.
---------------------------------------------------------**/
export const RegisterSchema = z.object({
    email: z.string().email(),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long"),
    displayName: z.string().trim().optional(),

    // ISO string; converted server-side to Date
    date_of_birth: z.string().optional(),

    // Profile metrics (raw)
    age: z.coerce.number().min(0).max(120).optional(),
    age_of_onset: z.coerce.number().min(0).max(120).optional(),
    years_since_onset: z.coerce.number().min(0).max(120).optional(),

    pulling_severity: z.coerce.number().min(0).max(10).optional(),

    // Raw categorical fields (used by FastAPI + overview)
    pulling_frequency: z.string().trim().optional(), // e.g. "daily", "weekly"
    pulling_awareness: z.string().trim().optional(), // e.g. "yes", "sometimes", "no"
    successfully_stopped: z
        .union([z.string().trim(), z.boolean()])
        .optional(), // "yes"/"no" or boolean
    how_long_stopped_days: z.coerce.number().min(0).optional(),

    emotion: z.string().trim().optional(),

    // Encoded versions (optional, if you derive them on the Node side)
    pulling_frequency_encoded: z.coerce
        .number()
        .int()
        .min(0)
        .max(5)
        .optional(),
    awareness_level_encoded: z.coerce.number().min(0).max(1).optional(),
    successfully_stopped_encoded: z.coerce.boolean().optional(),
    how_long_stopped_days_est: z.coerce.number().min(0).optional(),

    // ⬇️ NEW: coping strategies from registration / profile
    // Accept either comma-separated string or array of strings
    coping_worked: z
        .union([
            z.string().trim(),          // "fidget toy, deep breathing"
            z.array(z.string().trim()), // ["fidget toy", "deep breathing"]
        ])
        .optional(),

    coping_not_worked: z
        .union([
            z.string().trim(),
            z.array(z.string().trim()),
        ])
        .optional(),
});

// DTO type for user registration
export type RegisterDTO = z.infer<typeof RegisterSchema>;

/**---------------------
    🔑 Login schema
------------------------**/
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

// DTO type for user login
export type LoginDTO = z.infer<typeof LoginSchema>;

export default {
    RegisterSchema,
    LoginSchema,
};
