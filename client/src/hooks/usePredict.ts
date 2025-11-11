// client/src/hooks/usePredict.ts

import { useState } from "react";
import { predictApi } from "@/services/predictApi";
import { alertApi } from "@/services/alertApi";
import { useLogger } from "@/hooks/useLogger";
import type { PredictPayload, PredictionResponse } from "@/types/ml";

type WirePrediction =
  | PredictionResponse
  | (Omit<PredictionResponse, "risk_bucket"> & {
      risk_bucket: "LOW" | "MEDIUM" | "HIGH";
    });

/** 🧩 Normalize API variations (uppercase → lowercase buckets) */
const normalize = (resp: WirePrediction): PredictionResponse => {
  const bucket = (resp.risk_bucket as string).toLowerCase() as PredictionResponse["risk_bucket"];
  return { ...resp, risk_bucket: bucket };
};

/** Pull minimal user context from localStorage (if present) */
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
 * Also auto-creates a relapse alert when bucket is "high".
 */
export function usePredict() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { log, error: logError, warn } = useLogger(false); // no toasts here

  /** 🔮 Run prediction + normalize + log (+optional alert) */
  async function predict(payload: PredictPayload): Promise<PredictionResponse> {
    setLoading(true);
    setError(null);

    try {
      const wire = (await predictApi.predict(payload)) as WirePrediction;
      const normalized = normalize(wire);
      setResult(normalized);

      await log("Prediction successful", {
        risk_score: normalized.risk_score,
        risk_bucket: normalized.risk_bucket,
        confidence: normalized.confidence,
      });

      // 🚨 Auto-create alert when risk is HIGH
      if (normalized.risk_bucket === "high") {
        const email = getLocalUserEmail();
        try {
          await alertApi.create({
            score: normalized.risk_score,
            triggeredAt: new Date().toISOString(),
            sent: false,
            email, // optional
          });

          await warn("High-risk alert created", {
            score: normalized.risk_score,
            email: email ?? "(unknown)",
          });
        } catch (alertErr) {
          // Log alert creation failure but do not block prediction result
          await logError("Failed to create high-risk alert", {
            error:
              alertErr instanceof Error
                ? alertErr.message
                : String(alertErr),
            score: normalized.risk_score,
            email: email ?? "(unknown)",
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

      throw e; // rethrow for caller-specific handling
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
}
