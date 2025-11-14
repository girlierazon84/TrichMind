// client/src/hooks/useRegisterAndPredict.ts

import { useState } from "react";
import { useLogger, useAuth, usePredict } from "@/hooks";
import type { PredictionResponse, PredictPayload } from "@/types/ml";


/* ---------------------------------------------------------
    FORM DATA FROM REGISTER + PREDICT FORM
---------------------------------------------------------- */
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
    HELPERS
---------------------------------------------------------- */
const toNum = (v?: string): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const calculateAge = (dob?: string): number =>
    dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : 0;

// Convert text → ML encoder value
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

const mapSuccessful = (v?: string): number =>
    v?.toLowerCase() === "yes" ? 1 : 0;

/* ---------------------------------------------------------
    MAIN HOOK
---------------------------------------------------------- */
export const useRegisterAndPredict = () => {
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError } = useLogger(false);

    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    /* ---------------------------------------------------------
        REGISTER + PREDICT WORKFLOW
    ---------------------------------------------------------- */
    const registerAndPredict = async (
        form: RegisterFormData
    ): Promise<PredictionResponse | null> => {
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        try {
            /* -----------------------------------------------------
                1) Register if needed
            ------------------------------------------------------- */
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

                await log("User registered via Register & Predict", {
                    email: form.email,
                });
            } else {
                await log("Existing authenticated user re-used", {
                    userId: user?.id,
                });
            }

            /* -----------------------------------------------------
                2) Build Prediction Payload
            ------------------------------------------------------- */
            const payload: PredictPayload = {
                pulling_severity: toNum(form.pulling_severity),

                pulling_frequency_encoded: mapFrequency(form.pulling_frequency),
                awareness_level_encoded: mapAwareness(form.pulling_awareness),

                how_long_stopped_days_est: toNum(form.how_long_stopped_days),
                successfully_stopped_encoded: mapSuccessful(
                    form.successfully_stopped
                ),

                years_since_onset: toNum(form.years_since_onset),
                age: calculateAge(form.date_of_birth),
                age_of_onset: toNum(form.age_of_onset),

                emotion: form.emotion?.trim() || "neutral",
            };

            /* -----------------------------------------------------
                3) Predict
            ------------------------------------------------------- */
            const result = await predict(payload);
            setPrediction(result);

            await log("Prediction completed", {
                userId: user?.id ?? "guest",
                ...payload,
            });

            return result;
        } catch (err) {
            const msg =
                err instanceof Error
                    ? err.message
                    : "Register & Predict failed";

            setSubmitError(msg);

            await logError("Register & Predict error", {
                error: msg,
                email: form.email,
            });

            return null;
        } finally {
            setSubmitting(false);
        }
    };

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
