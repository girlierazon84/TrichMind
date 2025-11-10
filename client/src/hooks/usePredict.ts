// client/src/hooks/usePredict.ts

import { useState } from "react";
import { predictApi, PredictPayload, PredictionResponse } from "@/services/predictApi";

/** React hook that wraps the predict API */
export function usePredict() {
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function predict(payload: PredictPayload): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const res = await predictApi.predict(payload);
      setResult(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Prediction request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
}
