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

    // Profile metrics
    age: z.coerce.number().min(0).max(120).optional(),
    age_of_onset: z.coerce.number().min(0).max(120).optional(),
    years_since_onset: z.coerce.number().min(0).max(120).optional(),

    pulling_severity: z.coerce.number().min(0).max(10).optional(),
    pulling_frequency_encoded: z.coerce
        .number()
        .int()
        .min(0)
        .max(5)
        .optional(),
    awareness_level_encoded: z.coerce.number().min(0).max(1).optional(),
    successfully_stopped_encoded: z.coerce.boolean().optional(),
    how_long_stopped_days_est: z.coerce.number().min(0).optional(),
    emotion: z.string().trim().optional(),
});
export type RegisterDTO = z.infer<typeof RegisterSchema>;

/**--------------
🔑 Login schema
-----------------**/
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});
export type LoginDTO = z.infer<typeof LoginSchema>;
