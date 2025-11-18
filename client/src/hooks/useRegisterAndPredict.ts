// client/src/hooks/useRegisterAndPredict.ts

import { useState } from "react";
import {
    useLogger,
    useAuth,
    usePredict
} from "@/hooks";
import type {
    PredictionResponse,
    PredictPayload
} from "@/types/ml";


/* ---------------------------------------------------------
    Types
----------------------------------------------------------*/
export interface RegisterFormData {
    email: string;
    password: string;
    displayName?: string;

    date_of_birth?: string;
    age_of_onset?: string;
    years_since_onset?: string;

    pulling_severity?: string;
    pulling_frequency?: string;
    pulling_awareness?: string;

    successfully_stopped?: string;
    how_long_stopped_days?: string;

    emotion?: string;
}

/* ---------------------------------------------------------
    Helpers
----------------------------------------------------------*/
const toNum = (v?: string) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const calculateAge = (dob?: string): number => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

const mapFrequency = (v?: string): number => {
    if (!v) return 0;
    const x = v.toLowerCase();
    if (x.includes("rare")) return 1;
    if (x.includes("week")) return 2;
    if (x.includes("day")) return 3;
    return 0;
};

const mapAwareness = (v?: string): number => {
    if (!v) return 0;
    const x = v.toLowerCase();
    if (x.includes("yes")) return 1;
    if (x.includes("some")) return 0.5;
    return 0;
};

const mapSuccessful = (v?: string): number => {
    if (!v) return 0;
    return v.toLowerCase() === "yes" ? 1 : 0;
};

/* ---------------------------------------------------------
    Hook
----------------------------------------------------------*/
export const useRegisterAndPredict = () => {
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError } = useLogger(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    async function registerAndPredict(
        form: RegisterFormData
    ): Promise<PredictionResponse | null> {
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        try {
            // 1) Register only if NOT authenticated
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
                await log("Authenticated user detected", { userId: user?.id });
            }

            // 2) Build ML payload
            const payload: PredictPayload = {
                pulling_severity: toNum(form.pulling_severity),

                pulling_frequency_encoded: mapFrequency(form.pulling_frequency),
                awareness_level_encoded: mapAwareness(form.pulling_awareness),

                how_long_stopped_days_est: toNum(form.how_long_stopped_days),
                successfully_stopped_encoded: mapSuccessful(form.successfully_stopped),

                years_since_onset: toNum(form.years_since_onset),
                age: calculateAge(form.date_of_birth),
                age_of_onset: toNum(form.age_of_onset),

                emotion: form.emotion?.trim() || "neutral",
            };

            // 3) Execute ML prediction
            const result = await predict(payload);
            setPrediction(result);

            await log("Prediction completed", {
                userId: user?.id || "guest",
                emotion: payload.emotion,
            });

            return result;
        } catch (e) {
            const msg =
                e instanceof Error ? e.message : "Register & Predict failed";
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
};

export default useRegisterAndPredict;
