// client/src/hooks/useRiskTrendChart.ts

import { useState, useEffect } from "react";
import { axiosClient } from "@/services";

// ----------------------------------------------------
// Local Types
// ----------------------------------------------------
export interface HistoryPoint {
    date: string;
    score: number;
}

// ----------------------------------------------------
// Hook: useRiskTrendChart
// ----------------------------------------------------
export const useRiskTrendChart = () => {
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        const fetchTrend = async () => {
            setLoading(true);
            setError(null);

            try {
                // If user is not logged in, don't call backend
                const token = localStorage.getItem("access_token");
                if (!token) {
                    if (alive) {
                        setData([]);
                        setLoading(false);
                    }
                    return;
                }

                const res = await axiosClient.get<{ trend: HistoryPoint[] }>(
                    "/api/health/risk-trend"
                );
                if (!alive) return;

                setData(res.data?.trend ?? []);
            } catch (err) {
                console.error("[useRiskTrendChart] Failed to load trend:", err);
                if (alive) setError("Failed to load historical trend");
            } finally {
                if (alive) setLoading(false);
            }
        };

        void fetchTrend();
        return () => {
            alive = false;
        };
    }, []);

    return { data, loading, error };
};

export default useRiskTrendChart;
