// server/src/schemas/userSchema.ts

import { z } from "zod";

/**------------
    Helpers
---------------*/
// Accept either a CSV string or an array of strings, return array of strings
const csvOrArrayToArray = z.preprocess((v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
        const s = v.trim();
        if (!s) return [];
        return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
    return undefined;
}, z.array(z.string().trim().min(1))).optional();

// Preprocess date string to ISO string or undefined
const dateStringToIso = z.preprocess((v) => {
    if (v == null || v === "") return undefined;
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "string") return v;
    return undefined;
}, z.string()).optional();

/**-------------------------------------------------------
    🔐 User registration schema
    - Keep registration light (profile optional)
    - Aligns with new ML-friendly fields (not encoded)
----------------------------------------------------------*/
// Registration schema
export const RegisterSchema = z
    .object({
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters long"),
        displayName: z.string().trim().min(1).optional(),

        // ISO string; convert server-side to Date if you store Date
        date_of_birth: dateStringToIso,

        // Profile metrics (friendly)
        age: z.coerce.number().min(0).max(120).optional(),
        age_of_onset: z.coerce.number().min(0).max(120).optional(),
        years_since_onset: z.coerce.number().min(0).max(120).optional(),

        pulling_severity: z.coerce.number().min(0).max(10).optional(),
        pulling_frequency: z.string().trim().min(1).optional(), // "daily" | "weekly" | free text
        pulling_awareness: z.string().trim().min(1).optional(), // "yes" | "sometimes" | "no"
        successfully_stopped: z.union([z.boolean(), z.string().trim()]).optional(),
        how_long_stopped_days: z.coerce.number().min(0).optional(),
        emotion: z.string().trim().min(1).optional(),

        // Coping strategy lists: accept CSV or string[]
        coping_worked: csvOrArrayToArray,
        coping_not_worked: csvOrArrayToArray,
    })
    .strict();

// Type for registration data
export type RegisterDTO = z.infer<typeof RegisterSchema>;

/**---------------------
    🔑 Login schema
------------------------**/
export const LoginSchema = z
    .object({
        email: z.string().email(),
        password: z.string().min(1, "Password is required"),
    })
    .strict();

// Type for login data
export type LoginDTO = z.infer<typeof LoginSchema>;

export default {
    RegisterSchema,
    LoginSchema,
};
