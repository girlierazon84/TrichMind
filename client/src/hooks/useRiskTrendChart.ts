// client/src/hooks/useRiskTrendChart.ts

import { useState, useEffect } from "react";
import { predictApi }from "@/services";


// ──────────────────────────────
// Types
// ──────────────────────────────
// Historical risk point structure
export interface HistoryPoint {
    date: string;
    score: number;
}

// API response structure for prediction
type PredictResponse = {
    data: {
        trend: HistoryPoint[];
    };
};

// Predict API interface
interface PredictApi {
    predict: (opts: { path: string }) => Promise<PredictResponse>;
}

/** React hook to fetch historical risk trend for charting */
export const useRiskTrendChart = () => {
    // State variables
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch historical risk trend data
    useEffect(() => {
        let active = true;

        const fetchTrend = async () => {
            try {
                const api = predictApi as unknown as PredictApi;
                const res = await api.predict({ path: "/health/risk-trend" });

                const trend: HistoryPoint[] = res.data.trend.map((t: HistoryPoint) => ({
                    date: t.date,
                    score: t.score,
                }));

                if (active) setData(trend);
            } catch (err) {
                console.error(err);
                if (active) setError("Failed to load historical trend");
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchTrend();
        return () => { active = false };
    }, []);

    return { data, loading, error };
};

export default useRiskTrendChart;