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



/**----------TYPES-------------*/
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

    // optional – forwarded but not used in payload builder yet
    coping_worked?: string[];
    coping_not_worked?: string[];
}

/**------------HELPERS---------------*/
const toNum = (v?: string) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
};

const calculateAge = (dob?: string): number => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

/**---------HOOK------------*/
export const useRegisterAndPredict = () => {
    const { register, isAuthenticated, user } = useAuth();
    const { predict, loading: predicting, error: predictError } = usePredict();
    const { log, error: logError, warn } = useLogger(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

    /**
     * Returns:
     *  - true  → registration succeeded (ML may or may not have run)
     *  - false → registration failed
     */
    async function registerAndPredict(
        form: RegisterFormData
    ): Promise<boolean> {
        setSubmitting(true);
        setSubmitError(null);
        setPrediction(null);

        try {
            /* 1️⃣ Ensure the user account exists */
            if (!isAuthenticated) {
                if (!form.email?.trim() || !form.password) {
                    throw new Error("Email and password are required.");
                }

                const registered = await register({
                    email: form.email.trim(),
                    password: form.password,
                    displayName: form.displayName?.trim(),
                });

                if (!registered?.token) {
                    throw new Error("Registration failed");
                }

                await log("User registered successfully", { email: form.email });
            } else {
                await log("Authenticated user detected (skipping register)", {
                    userId: user?.id,
                });
            }

            /* 2️⃣ Build ML payload (same as before) */
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

            /* 3️⃣ Try ML prediction – but DO NOT treat as fatal */
            try {
                const result = await predict(payload);
                setPrediction(result);

                await log("Register & Predict – ML completed", {
                    userId: user?.id || "guest",
                    risk_score: result.risk_score,
                    risk_bucket: result.risk_bucket,
                });
            } catch (mlErr: unknown) {
                const msg =
                    mlErr instanceof Error ? mlErr.message : String(mlErr);

                await logError(
                    "Register & Predict – ML failed (account already created)",
                    {
                        error: msg,
                        email: form.email,
                    }
                );

                // Optional: softer warning instead of "hard" error state
                await warn("ML coach offline during registration", {
                    email: form.email,
                    message: msg,
                });

                // ❗ Important: we DO NOT set submitError here,
                // and we DO NOT throw, so registration remains a success.
            }

            // ✅ At this point, registration definitely succeeded
            return true;
        } catch (e: unknown) {
            const msg =
                e instanceof Error ? e.message : "Register & Predict failed";

            setSubmitError(msg);

            await logError("Register & Predict process failed", {
                error: msg,
                email: form.email,
            });

            return false;
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
