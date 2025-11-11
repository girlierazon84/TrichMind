// client/src/hooks/useRegisterAndPredict.ts

import { useState } from "react";
import { useLogger, useAuth, usePredict} from "@/hooks";
import type { PredictionResponse, PredictPayload } from "@/types/ml";

export interface RegisterFormData {
    email: string;
    password: string;
    displayName?: string;
    date_of_birth?: string;
    age_of_onset?: string;
    years_since_onset?: string;
    pulling_severity?: string;
    pulling_frequency_encoded?: string;
    awareness_level_encoded?: string;
    successfully_stopped_encoded?: boolean;
    how_long_stopped_days_est?: string;
    emotion?: string;
}

/**
 * 🧩 useRegisterAndPredict — Unified hook for:
 *  - Registering a new user (if not already logged in)
 *  - Immediately running relapse-risk prediction
 *  - Returning prediction results and state
 */
export function useRegisterAndPredict() {
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError } = useLogger(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    /** 🧮 Compute user age from date of birth */
    const calculateAge = (dob?: string): number => {
        if (!dob) return 0;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    /**
     * 🔄 Register new user (if needed) + run prediction
     */
    async function registerAndPredict(form: RegisterFormData): Promise<PredictionResponse | null> {
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        try {
            // ──────────────── Step 1: Register only if not already authenticated
            if (!isAuthenticated) {
                const registered = await register({
                    email: form.email.trim(),
                    password: form.password,
                    displayName: form.displayName?.trim(),
                });

                if (!registered?.token) throw new Error("Registration failed");
                await log("User registered successfully", { email: form.email });
            } else {
                await log("Existing authenticated user detected", { userId: user?.id });
            }

            // ──────────────── Step 2: Build ML model payload
            const payload: PredictPayload = {
                pulling_severity: Number(form.pulling_severity || 0),
                pulling_frequency_encoded: Number(form.pulling_frequency_encoded || 0),
                awareness_level_encoded: Number(form.awareness_level_encoded || 0),
                how_long_stopped_days_est: Number(form.how_long_stopped_days_est || 0),
                successfully_stopped_encoded: form.successfully_stopped_encoded ? 1 : 0,
                years_since_onset: Number(form.years_since_onset || 0),
                age: calculateAge(form.date_of_birth),
                age_of_onset: Number(form.age_of_onset || 0),
                emotion: form.emotion?.trim() || "neutral",
            };

            // ──────────────── Step 3: Run ML prediction
            const result = await predict(payload);
            setPrediction(result);

            await log("Prediction completed", {
                userId: user?.id || "guest",
                emotion: payload.emotion,
            });

            return result;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Register & Predict failed";
            setSubmitError(msg);
            await logError("Register & Predict process failed", {
                error: msg,
                email: form.email,
            });
            return null;
        } finally {
            setSubmitting(false);
        }
    }

    return {
        registerAndPredict,
        submitting,
        submitError,
        prediction,
        predicting,
        predictError,
    };
}
