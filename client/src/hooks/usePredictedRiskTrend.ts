// client/src/hooks/usePredictedRiskTrend.ts

import { useEffect, useState } from "react";
import { axiosClient } from "@/services";

interface PredictedPoint {
    day: number;
    predicted_risk: number;
}

interface MLTrendResponse {
    trend: PredictedPoint[];
}

export const usePredictedRiskTrend = (days: number = 14) => {
    const [trend, setTrend] = useState<PredictedPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const fetchTrend = async () => {
            try {
                const res = await axiosClient.get<MLTrendResponse>(`/risk-trend?days=${days}`);
                if (alive) {
                    setTrend(res.data.trend);
                }
            } catch (err: unknown) {
                console.error(err);
                if (alive) {
                    setError("Failed to load predicted risk trend");
                }
            } finally {
                if (alive) setLoading(false);
            }
        };

        fetchTrend();
        return () => { alive = false };
    }, [days]);

    return { trend, loading, error };
};
