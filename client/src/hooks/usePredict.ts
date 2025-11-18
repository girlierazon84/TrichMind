// client/src/hooks/usePredict.ts

import { useState } from "react";
import { toast } from "react-toastify";
import { predictApi, alertApi } from "@/services";
import { useLogger } from "@/hooks";
import type {
  PredictPayload,
  PredictionResponse
} from "@/types/ml";


/** Wire shape (allows uppercase buckets) */
type WirePrediction =
  | PredictionResponse
  | (Omit<PredictionResponse, "risk_bucket"> & {
      risk_bucket: "LOW" | "MEDIUM" | "HIGH";
    });

// Normalize API response to consistent risk_bucket format
const normalize = (resp: WirePrediction): PredictionResponse => {
  const bucket = String(resp.risk_bucket || "medium").toLowerCase() as
    | "low"
    | "medium"
    | "high";
  return { ...resp, risk_bucket: bucket };
};

// Threshold to trigger relapse alerts
const RELAPSE_ALERT_THRESHOLD = 0.7;

// Retrieve user email from localStorage (if available)
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

// React hook for making predictions
export const usePredict = () => {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { log, error: logError, warn } = useLogger(false);

  async function predict(payload: PredictPayload): Promise<PredictionResponse> {
    setLoading(true);
    setError(null);

    try {
      const wire = (await predictApi.predict(payload)) as WirePrediction;
      const normalized = normalize(wire);
      setResult(normalized);

      await log("Prediction completed", {
        risk_score: normalized.risk_score,
        risk_bucket: normalized.risk_bucket,
        confidence: normalized.confidence,
      });

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
        } catch (alertErr) {
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
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Prediction request failed";
      setError(msg);

      await logError("Prediction error", {
        message: msg,
        payloadSummary: {
          pulling_severity: payload.pulling_severity,
          frequency: payload.pulling_frequency,
          age: payload.age,
        },
      });

      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
};

// Show supportive toast based on prediction result
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
