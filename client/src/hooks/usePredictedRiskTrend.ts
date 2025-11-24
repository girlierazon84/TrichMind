// client/src/hooks/usePredictedRiskTrend.ts

import { useEffect, useState } from "react";
import { axiosClient } from "@/services";

// --------------------------
// Types and Interfaces
// --------------------------
export interface PredictedPoint {
    day: number;
    predicted_risk: number;
}

interface MLTrendResponse {
    trend: PredictedPoint[];
}

// -----------------------------
// usePredictedRiskTrend Hook
// -----------------------------
export const usePredictedRiskTrend = (days: number = 14) => {
    const [trend, setTrend] = useState<PredictedPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch predicted risk trend on mount or when days change
    useEffect(() => {
        let alive = true;

        const fetchTrend = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axiosClient.get<MLTrendResponse>(
                    `/api/ml/risk-trend?days=${days}`
                );
                if (!alive) return;

                setTrend(res.data?.trend ?? []);
            } catch (err) {
                console.error("[usePredictedRiskTrend] Failed to load trend:", err);
                if (alive) setError("Failed to load predicted risk trend");
            } finally {
                if (alive) setLoading(false);
            }
        };

        void fetchTrend();
        return () => {
            alive = false;
        };
    }, [days]);

    return { trend, loading, error };
};

export default usePredictedRiskTrend;
