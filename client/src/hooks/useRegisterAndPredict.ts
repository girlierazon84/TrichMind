// client/src/hooks/useRegisterAndPredict.ts

import { useState } from "react";
import { useLogger, useAuth, usePredict } from "@/hooks";
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
 * Register (if needed) + immediately predict.
 */
export const useRegisterAndPredict = () => {
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError } = useLogger(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    const toNum = (v?: string) => {
        const n = Number(v ?? 0);
        return Number.isFinite(n) ? n : 0;
    };

    const calculateAge = (dob?: string): number => {
        if (!dob) return 0;
        const diff = Date.now() - new Date(dob).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    };

    async function registerAndPredict(form: RegisterFormData): Promise<PredictionResponse | null> {
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        try {
            // 1) Register only if not already authenticated
            if (!isAuthenticated) {
                if (!form.email?.trim() || !form.password) {
                    throw new Error("Email and password are required.");
                }
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

            // 2) Build payload
            const payload: PredictPayload = {
                pulling_severity: toNum(form.pulling_severity),
                pulling_frequency_encoded: toNum(form.pulling_frequency_encoded),
                awareness_level_encoded: toNum(form.awareness_level_encoded),
                how_long_stopped_days_est: toNum(form.how_long_stopped_days_est),
                successfully_stopped_encoded: form.successfully_stopped_encoded ? 1 : 0,
                years_since_onset: toNum(form.years_since_onset),
                age: calculateAge(form.date_of_birth),
                age_of_onset: toNum(form.age_of_onset),
                emotion: form.emotion?.trim() || "neutral",
            };

            // 3) Predict
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

export default useRegisterAndPredict;