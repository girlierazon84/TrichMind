// client/src/hooks/usePredict.ts
"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { predictApi, alertApi } from "@/services";
import { useLogger } from "@/hooks";
import type {
    PredictPayload,
    PredictionResponse,
    RiskBucket
} from "@/types/ml";


/**--------------------------------------------------
    Custom hook to manage ML predictions.
    Handles relapse risk prediction and alerting.
-----------------------------------------------------*/
// Wire format may vary; normalize to PredictionResponse
type WirePrediction =
    | PredictionResponse
    | (Omit<PredictionResponse, "risk_bucket" | "risk_code"> & {
        risk_bucket: "LOW" | "MEDIUM" | "HIGH" | RiskBucket | string;
        risk_code?: string | number;
        ok?: boolean;
        message?: string;
        error?: string;
        prediction?: unknown;
    });

// Generic object type
type GenericObject = Record<string, unknown>;

// Default offline message
const ML_OFFLINE_MESSAGE =
    "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚";

// Raw prediction shape before normalization
interface RawPredictionShape extends GenericObject {
    risk_score?: unknown;
    confidence?: unknown;
    risk_bucket?: unknown;
    model_version?: unknown;
    risk_code?: unknown;
    runtime_sec?: unknown;
    debug?: unknown;
    ok?: unknown;
    message?: unknown;
    error?: unknown;
    prediction?: unknown;
}

// Normalize various wire formats to PredictionResponse
const normalize = (resp: WirePrediction | GenericObject): PredictionResponse => {
    // Direct shape
    let body = resp as RawPredictionShape;

    // Legacy nested shape: { ok: true, prediction: {...} }
    if (body && typeof body === "object" && "prediction" in body && !("risk_score" in body)) {
        body = body.prediction as RawPredictionShape;
    }

    // Defensive: handle { ok:false } with 200
    if (body && typeof body === "object" && body.ok === false) {
        // Extract error message
        const msg =
            (body.message as string | undefined) ||
            (body.error as string | undefined) ||
            ML_OFFLINE_MESSAGE;
        throw new Error(msg);
    }

    // Extract and validate fields
    const riskScore = typeof body.risk_score === "number" ? body.risk_score : undefined;
    if (riskScore === undefined) {
        // Missing risk_score indicates error
        const msg =
            (body?.message as string | undefined) ||
            (body?.error as string | undefined) ||
            ML_OFFLINE_MESSAGE;
        throw new Error(msg);
    }

    // Determine risk bucket
    const rawBucket =
        body.risk_bucket != null
            ? String(body.risk_bucket)
            : body.risk_code != null
                ? String(body.risk_code)
                : "medium";

    // Normalize bucket to allowed values
    const bucketLower = rawBucket.toLowerCase();
    const allowedBuckets: RiskBucket[] = ["low", "medium", "high"];
    const bucket: RiskBucket = allowedBuckets.includes(bucketLower as RiskBucket)
        ? (bucketLower as RiskBucket)
        : "medium";

    // Determine risk code
    const risk_code =
        body.risk_code !== undefined && body.risk_code !== null ? String(body.risk_code) : bucket;

    // Confidence score
    const confidence = typeof body.confidence === "number" ? body.confidence : 0.5;

    return {
        risk_score: riskScore,
        confidence,
        risk_bucket: bucket,
        model_version: body.model_version as string | undefined,
        risk_code,
        runtime_sec: body.runtime_sec as number | undefined,
        debug: body.debug,
    };
};

// Threshold for triggering relapse alert
const RELAPSE_ALERT_THRESHOLD = 0.7;

// Check if payload is trivial/default
const isTrivialPayload = (payload: PredictPayload): boolean => {
    return (
        payload.age === 0 &&
        payload.age_of_onset === 0 &&
        (payload.years_since_onset ?? 0) === 0 &&
        payload.pulling_severity === 0 &&
        payload.pulling_frequency === "unknown" &&
        payload.pulling_awareness === "unknown" &&
        (payload.successfully_stopped === "no" || payload.successfully_stopped === false) &&
        payload.how_long_stopped_days === 0 &&
        payload.emotion === "neutral"
    );
};

// SSR-safe localStorage helpers
function safeLocalStorageSet(key: string, value: string) {
    // Check for window (SSR)
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // ignore
    }
}

// Main hook export function
export const usePredict = () => {
    // State variables for prediction result, loading, and error handling
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Logger hook (for analytics and error logging)
    const { log, error: logError, warn } = useLogger(false);

    // Main predict function
    async function predict(payload: PredictPayload): Promise<PredictionResponse> {
        // Reset state before prediction call
        setLoading(true);
        setError(null);

        // Perform prediction API call
        try {
            // Validate payload
            if (isTrivialPayload(payload)) {
                // Prevent meaningless predictions
                throw new Error("Prediction payload is empty/default. Please provide your real data.");
            }

            // Call prediction API
            const wire = (await predictApi.predict(payload)) as WirePrediction;
            const normalized = normalize(wire);

            // Update state with normalized result
            setResult(normalized);

            // Persist last prediction for dashboards
            safeLocalStorageSet("tm_last_prediction", JSON.stringify(normalized));

            // Log prediction event for analytics
            void log("Prediction completed", {
                risk_score: normalized.risk_score,
                risk_bucket: normalized.risk_bucket,
                confidence: normalized.confidence,
            });

            // Determine if alert should be triggered to user and backend service (for email)
            const shouldTriggerAlert =
                normalized.risk_bucket === "high" || normalized.risk_score >= RELAPSE_ALERT_THRESHOLD;

            // Trigger relapse alert if needed
            if (shouldTriggerAlert) {
                // Ask backend to send alert (auth required)
                try {
                    // Send alert request to backend
                    const alertRes = await alertApi.sendRelapse(normalized.risk_score);

                    // Log alert result for debugging
                    void warn("Relapse risk alert processed", {
                        score: normalized.risk_score,
                        risk_bucket: normalized.risk_bucket,
                        threshold: RELAPSE_ALERT_THRESHOLD,
                        ok: alertRes.ok,
                        sent: alertRes.ok ? alertRes.sent : false,
                        message: alertRes.message,
                    });
                } catch (alertErr: unknown) {
                    // Log alert error but do not block user flow
                    const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
                    void logError("Relapse alert request failed", {
                        error: msg,
                        score: normalized.risk_score,
                        risk_bucket: normalized.risk_bucket,
                    });
                }

                // Show supportive toast (independent of email success)
                showSupportiveToast(normalized);
            }

            return normalized;
        } catch (e: unknown) {
            // Extract meaningful error message for user display and logging
            let msg = "Prediction request failed";

            // Axios error handling for detailed messages
            if (e && typeof e === "object") {
                // Type assertion for AxiosError shape
                const axiosErr = e as AxiosError<{ message?: string; error?: string }>;
                if (axiosErr.isAxiosError) {
                    // Try to extract message from response data if available
                    const data = axiosErr.response?.data;
                    msg = data?.message || data?.error || axiosErr.message || msg;
                } else if (e instanceof Error) {
                    // Generic Error object
                    msg = e.message;
                }
            } else if (e instanceof Error) {
                // Generic Error object
                msg = e.message;
            }

            // Update error state
            setError(msg);

            // Log error for diagnostics with payload summary
            void logError("Prediction error", {
                message: msg,
                payloadSummary: {
                    // Only include non-sensitive fields for logging purposes
                    pulling_severity: payload.pulling_severity,
                    frequency: payload.pulling_frequency,
                    age: payload.age,
                },
            });

            throw e;
        } finally {
            // Reset loading state after operation completes (regardless of success/failure)
            setLoading(false);
        }
    }

    return { predict, result, loading, error };
};

// Show supportive toast messages based on risk level
function showSupportiveToast(result: PredictionResponse) {
    // Determine message based on risk level and score thresholds
    const msg =
        result.risk_bucket === "high"
            ? `⚠️ High relapse risk detected (score: ${(result.risk_score * 100).toFixed(
                1
            )}%). Remember to take a calming break, breathe, and use your EmpowerKit tools. 🌿`
            : result.risk_score >= RELAPSE_ALERT_THRESHOLD
                ? `🧠 Elevated relapse risk detected (score: ${(result.risk_score * 100).toFixed(
                    1
                )}%). You’re doing great — consider journaling or using your grounding strategies. ✨`
                : null;

    // Show toast if there's a message to display
    if (!msg) return;

    // Display warning toast with custom styling
    toast.warn(msg, {
        // Toast options
        position: "bottom-center",
        autoClose: 8000,
        style: {
            background: "#fff8e1",
            color: "#3e2723",
            borderRadius: "10px",
            border: "1px solid #ffe082",
            fontWeight: 500,
        },
    });
}

export default usePredict;
