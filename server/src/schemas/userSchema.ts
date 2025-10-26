import { z } from "zod";

export const RegisterDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    displayName: z.string().optional(),
    date_of_birth: z.string().optional(),
    age_of_onset: z.number().optional(),
    pulling_severity: z.number().optional(),
    pulling_frequency_encoded: z.number().optional(),
    awareness_level_encoded: z.number().optional(),
    successfully_stopped_encoded: z.boolean().optional(),
    how_long_stopped_days_est: z.number().optional(),
    emotion: z.string().optional(),
});

export const LoginDTO = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});
