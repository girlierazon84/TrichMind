// client/src/hooks/useRegisterAndPredict.ts
import { useState } from "react";
import { useAuth, usePredict } from "@/hooks";
import type { PredictionResponse, PredictPayload } from "@/types/ml";

interface RegisterFormData {
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

export function useRegisterAndPredict() {
    const { register } = useAuth();
    const { predict, loading: predictLoading, error: predictError } = usePredict();

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

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
            // 1) Register (your useAuth.register should set token & auth header)
            await register({
                email: form.email.trim(),
                password: form.password,
                displayName: form.displayName?.trim(),
            });

            // 2) Build payload
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

            // 3) Predict and keep the value
            const predicted = await predict(payload);
            setPrediction(predicted);
            return predicted;
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Register & Predict failed";
            setSubmitError(msg);
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
        predicting: predictLoading,
        predictError,
    };
}
