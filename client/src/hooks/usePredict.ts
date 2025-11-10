// client/src/hooks/usePredict.ts

import { useState } from "react";
import { axiosClient } from "@/services/axiosClient";

export interface PredictInput {
  pulling_severity: number;
  pulling_frequency_encoded: number;
  awareness_level_encoded: number;
  how_long_stopped_days_est: number;
  successfully_stopped_encoded: number;
  years_since_onset: number;
  age: number;
  age_of_onset: number;
  emotion_intensity_sum?: number;
  anxiety_level?: number;
  depression_level?: number;
  coping_strategies_effective?: number;
  sleep_quality_score?: number;
}

export interface PredictResponse {
  risk_score: number;
  risk_bucket: string;
  risk_code: number;
  confidence: number;
  model_version: string;
}

export function usePredict(endpoint: string = "/predict") {
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function predict(payload: PredictInput): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.post<{ prediction: PredictResponse }>(
        endpoint,
        payload
      );
      setResult(data.prediction);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Prediction request failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { predict, result, loading, error };
}
