// client/src/hooks/usePredict.ts

import { useState } from "react";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { predictApi, alertApi } from "@/services";
import { useLogger } from "@/hooks";
import type {
  PredictPayload,
  PredictionResponse,
  RiskBucket,
} from "@/types/ml";


/**--------------------------------------------------------------
    Wire shape (allows uppercase buckets & numeric risk_code)
-----------------------------------------------------------------*/
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

interface RiskCodeCarrier {
  risk_code?: string | number;
  [key: string]: unknown;
}

// Generic "object-like" type to avoid `any`
type GenericObject = Record<string, unknown>;

const ML_OFFLINE_MESSAGE =
  "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚";

/** Raw shape we expect from the backend, but still loose enough for safety */
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

/**-----------------------------------------------------------------
    Normalize API response to consistent risk_bucket & risk_code
--------------------------------------------------------------------*/
const normalize = (resp: WirePrediction | GenericObject): PredictionResponse => {
  let body = resp as RawPredictionShape;

  // Handle `{ ok: true, prediction: {...} }` just in case
  if (
    body &&
    typeof body === "object" &&
    "prediction" in body &&
    !("risk_score" in body)
  ) {
    body = body.prediction as RawPredictionShape;
  }

  // Handle `{ ok: false, ... }` shape with 200 status (defensive)
  if (body && typeof body === "object" && body.ok === false) {
    const msg =
      (body.message as string | undefined) ||
      (body.error as string | undefined) ||
      ML_OFFLINE_MESSAGE;
    throw new Error(msg);
  }

  // Extract risk_score
  const riskScore =
    typeof body.risk_score === "number"
      ? body.risk_score
      : undefined;

  // If we don't even have a score, treat as ML offline/problem.
  if (riskScore === undefined) {
    const msg =
      (body?.message as string | undefined) ||
      (body?.error as string | undefined) ||
      ML_OFFLINE_MESSAGE;
    throw new Error(msg);
  }

  // Prefer explicit risk_bucket; fall back to risk_code; then to "medium"
  const rawBucket =
    body.risk_bucket != null
      ? String(body.risk_bucket)
      : body.risk_code != null
      ? String(body.risk_code)
      : "medium";

  const bucketLower = rawBucket.toLowerCase();
  const allowedBuckets: RiskBucket[] = ["low", "medium", "high"];
  const bucket: RiskBucket = allowedBuckets.includes(
    bucketLower as RiskBucket
  )
    ? (bucketLower as RiskBucket)
    : "medium";

  const carrier = body as RiskCodeCarrier;
  const rawRiskCode = carrier.risk_code;

  const risk_code =
    rawRiskCode !== undefined && rawRiskCode !== null
      ? String(rawRiskCode)
      : bucket;

  const confidence =
    typeof body.confidence === "number" ? body.confidence : 0.5;

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

/**----------------------------------------
    Threshold to trigger relapse alerts
-------------------------------------------*/
const RELAPSE_ALERT_THRESHOLD = 0.7;

/**---------------------------------
    Detect “dummy/demo” payloads
------------------------------------*/
const isTrivialPayload = (payload: PredictPayload): boolean => {
  return (
    payload.age === 0 &&
    payload.age_of_onset === 0 &&
    (payload.years_since_onset ?? 0) === 0 &&
    payload.pulling_severity === 0 &&
    payload.pulling_frequency === "unknown" &&
    payload.pulling_awareness === "unknown" &&
    (payload.successfully_stopped === "no" ||
      payload.successfully_stopped === false) &&
    payload.how_long_stopped_days === 0 &&
    payload.emotion === "neutral"
  );
};

/**---------------------------------------------------------
    Retrieve user email from localStorage (if available)
------------------------------------------------------------*/
function getLocalUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { email?: string };
    return typeof parsed.email === "string" ? parsed.email : undefined;
  } catch {
    return undefined;
  }
}

/**--------------------------------------
    React hook for making predictions
-----------------------------------------*/
export const usePredict = () => {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { log, error: logError, warn } = useLogger(false);

  async function predict(payload: PredictPayload): Promise<PredictionResponse> {
    setLoading(true);
    setError(null);
    try {
      // 🚫 Block demo / empty payloads
      if (isTrivialPayload(payload)) {
        throw new Error(
          "Prediction payload is empty/default. Please provide your real data."
        );
      }

      const wire = (await predictApi.predict(payload)) as WirePrediction;
      const normalized = normalize(wire);

      setResult(normalized);

      // 🔹 Persist last prediction for dashboard
      try {
        localStorage.setItem(
          "tm_last_prediction",
          JSON.stringify(normalized)
        );
      } catch {
        // ignore storage failures
      }

      // Logging
      await log("Prediction completed", {
        risk_score: normalized.risk_score,
        risk_bucket: normalized.risk_bucket,
        confidence: normalized.confidence,
      });

      // Check if alert should be triggered
      const shouldTriggerAlert =
        normalized.risk_bucket === "high" ||
        normalized.risk_score >= RELAPSE_ALERT_THRESHOLD;

      if (shouldTriggerAlert) {
        const email = getLocalUserEmail();

        // 1️⃣ Save alert
        try {
          await alertApi.create({
            score: normalized.risk_score,
            triggeredAt: new Date().toISOString(),
            sent: false,
            email,
          });

          await warn("Relapse risk alert created", {
            score: normalized.risk_score,
            risk_bucket: normalized.risk_bucket,
            threshold: RELAPSE_ALERT_THRESHOLD,
            email: email ?? "(unknown)",
          });
        } catch (alertErr: unknown) {
          const msg =
            alertErr instanceof Error
              ? alertErr.message
              : String(alertErr);

          await logError("Failed to create relapse alert", {
            error: msg,
            score: normalized.risk_score,
            risk_bucket: normalized.risk_bucket,
          });
        }

        // 2️⃣ Show supportive toast
        showSupportiveToast(normalized);
      }

      return normalized;
    } catch (e: unknown) {
      let msg = "Prediction request failed";

      // Surface backend offline message if Axios has a response
      if (e && typeof e === "object") {
        const axiosErr = e as AxiosError<{
          message?: string;
          error?: string;
        }>;
        if (axiosErr.isAxiosError) {
          const data = axiosErr.response?.data;
          msg =
            data?.message ||
            data?.error ||
            axiosErr.message ||
            msg;
        } else if (e instanceof Error) {
          msg = e.message;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }

      setError(msg);

      await logError("Prediction error", {
        message: msg,
        payloadSummary: {
          pulling_severity: payload.pulling_severity,
          frequency: payload.pulling_frequency,
          age: payload.age,
        },
      });

      // Re-throw so callers (e.g. Register & Predict) can react
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
};

/**-----------------------------------------------------
    Show supportive toast based on prediction result
--------------------------------------------------------*/
function showSupportiveToast(result: PredictionResponse) {
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

  if (msg) {
    toast.warn(msg, {
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
}

export default usePredict;
