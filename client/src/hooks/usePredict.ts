// client/src/hooks/usePredict.ts

import { useState } from "react";
import { predictApi } from "@/services/predictApi";
import { useLogger } from "@/hooks/useLogger";
import type { PredictPayload, PredictionResponse } from "@/types/ml";


/** 🧩 Possible API response variations */
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

/**
 * ⚙️ usePredict — manages prediction flow + local state
 * Automatically logs prediction summary & errors via useLogger
 */
export function usePredict() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { log, error: logError } = useLogger(false); // disable toasts here for cleaner UX

  /** 🔮 Run prediction + normalize + log */
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

      throw e; // Allow caller to handle UI-specific errors
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
}
