// client/src/hooks/usePredict.ts

import { useState } from "react";
import { predictApi } from "@/services/predictApi";
import { alertApi } from "@/services/alertApi";
import { useLogger } from "@/hooks/useLogger";
import type { PredictPayload, PredictionResponse } from "@/types/ml";

/** 🧩 Normalize API variations (uppercase → lowercase buckets) */
type WirePrediction =
  | PredictionResponse
  | (Omit<PredictionResponse, "risk_bucket"> & {
      risk_bucket: "LOW" | "MEDIUM" | "HIGH";
    });

const normalize = (resp: WirePrediction): PredictionResponse => {
  const bucket = (resp.risk_bucket as string).toLowerCase() as PredictionResponse["risk_bucket"];
  return { ...resp, risk_bucket: bucket };
};

/** 🔧 Configurable threshold for triggering relapse alerts */
const RELAPSE_ALERT_THRESHOLD = 0.7;

/** 🧠 Retrieve minimal user email (stored post-login) */
function getLocalUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return typeof parsed?.email === "string" ? parsed.email : undefined;
  } catch {
    return undefined;
  }
}

/**
 * ⚙️ usePredict — manages prediction flow + local state
 * Includes:
 *  - Logging via useLogger
 *  - Auto alert creation on high relapse risk
 */
export function usePredict() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { log, error: logError, warn } = useLogger(false); // silent backend logging

  /** 🔮 Run prediction + log + auto-alert */
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
        normalized.risk_bucket === "high" || normalized.risk_score >= RELAPSE_ALERT_THRESHOLD;

      if (shouldTriggerAlert) {
        const email = getLocalUserEmail();
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
          await logError("Failed to create relapse alert", {
            error:
              alertErr instanceof Error
                ? alertErr.message
                : String(alertErr),
            score: normalized.risk_score,
            risk_bucket: normalized.risk_bucket,
          });
        }
      }

      return normalized;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Prediction request failed";
      setError(msg);

      await logError("Prediction error", {
        message: msg,
        payloadSummary: {
          pulling_severity: payload.pulling_severity,
          frequency: payload.pulling_frequency_encoded,
          age: payload.age,
        },
      });

      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
}
