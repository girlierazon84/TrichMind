// server/src/schemas/userSchema.ts
import { z } from "zod";

/**
 * 🔐 User registration schema
 * Aligned with authController & User Mongoose model.
 */
export const RegisterDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    displayName: z.string().trim().optional(),
    date_of_birth: z.string().optional(), // ISO string; converted server-side
    age_of_onset: z.number().min(0).max(120).optional(),
    years_since_onset: z.number().min(0).max(120).optional(),
    pulling_severity: z.number().min(0).max(10).optional(),
    pulling_frequency_encoded: z.number().int().min(0).max(5).optional(),
    awareness_level_encoded: z.number().min(0).max(1).optional(),
    successfully_stopped_encoded: z.boolean().optional(),
    how_long_stopped_days_est: z.number().min(0).optional(),
    emotion: z.string().trim().optional(),
});
export type RegisterDTO = z.infer<typeof RegisterDTO>;

/** 🔑 Login schema */
export const LoginDTO = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});
export type LoginDTO = z.infer<typeof LoginDTO>;
