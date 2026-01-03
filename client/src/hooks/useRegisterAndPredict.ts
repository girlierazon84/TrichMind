// client/src/hooks/useRegisterAndPredict.ts
"use client";

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


/**-----------------------------------------------------------
    Form data for user registration and prediction process
--------------------------------------------------------------*/
// Note: all fields are strings as they come from form inputs
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

    coping_worked?: string[];
    coping_not_worked?: string[];
}

// Helper to convert string to number with fallback to 0 if invalid
const toNum = (v?: string) => {
    // Convert to number and ensure it's finite
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

// Helper to calculate age from date of birth string (e.g., "1990-05-15")
const calculateAge = (dob?: string): number => {
    // Return 0 if dob is not provided or invalid
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

/**-------------------------------------------------------------------
    Hook to handle user registration and ML prediction in one flow
----------------------------------------------------------------------*/
// Combines user registration and ML prediction into a single process
export const useRegisterAndPredict = () => {
    // Auth hook for registration and user info
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError, warn } = useLogger(false);

    // State for submission process and results
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    // Main function to register user and get ML prediction
    async function registerAndPredict(form: RegisterFormData): Promise<boolean> {
        // Reset state at start of submission process
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        // Trim email for consistency and validation
        const email = form.email?.trim();

        // Begin process with error handling
        try {
            // 1) Ensure account exists
            if (!isAuthenticated) {
                if (!email || !form.password) throw new Error("Email and password are required.");

                // Register new user and get token (if successful)
                const registered = await register({
                    email,
                    password: form.password,
                    displayName: form.displayName?.trim(),
                });

                // Ensure registration returned a token (indicating success)
                if (!registered?.token) throw new Error("Registration failed");

                // Log successful registration event
                void log("User registered successfully", { email });
            } else {
                // Log that user is already authenticated (skipping registration)
                void log("Authenticated user detected (skipping register)", {
                    userId: user?.id ?? "(unknown)",
                    email: user?.email ?? "(unknown)",
                });
            }

            // 2) Build ML payload
            const payload: PredictPayload = {
                age: calculateAge(form.date_of_birth),
                age_of_onset: toNum(form.age_of_onset),
                years_since_onset: toNum(form.years_since_onset),

                pulling_severity: toNum(form.pulling_severity),
                pulling_frequency: form.pulling_frequency || "unknown",
                pulling_awareness: form.pulling_awareness || "unknown",

                successfully_stopped: form.successfully_stopped || "no",
                how_long_stopped_days: toNum(form.how_long_stopped_days),

                emotion: form.emotion?.trim() || "neutral",
            };

            // 3) Try ML prediction (non-fatal)
            try {
                // Call predict API with constructed payload and store result
                const result = await predict(payload);
                setPrediction(result);

                // Log successful prediction event with details
                void log("Register & Predict – ML completed", {
                    email: email ?? user?.email ?? "(unknown)",
                    risk_score: result.risk_score,
                    risk_bucket: result.risk_bucket,
                });
            } catch (mlErr: unknown) {
                // Log ML prediction failure but continue process onwards
                const msg = mlErr instanceof Error ? mlErr.message : String(mlErr);

                // Log the error for debugging purposes
                void logError("Register & Predict – ML failed (account already created)", {
                    error: msg,
                    email: email ?? "(unknown)",
                });

                // Warn that ML is offline but registration succeeded
                void warn("ML coach offline during registration", {
                    email: email ?? "(unknown)",
                    message: msg,
                });
            }

            return true;
        } catch (e: unknown) {
            // Capture and log any errors during registration or prediction process
            const msg = e instanceof Error ? e.message : "Register & Predict failed";
            setSubmitError(msg);

            // Log the error for debugging purposes
            void logError("Register & Predict process failed", {
                error: msg,
                email: email ?? "(unknown)",
            });

            return false;
        } finally {
            // Ensure submitting state is cleared at the end of the process regardless of outcome
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
