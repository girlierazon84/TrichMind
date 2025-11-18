// client/src/hooks/useRiskTrendChart.ts

import { useState, useEffect } from "react";
import { axiosClient } from "@/services";


// Historical risk point structure
export interface HistoryPoint {
    date: string;
    score: number;
}

// API response structure from backend
interface RiskTrendResponse {
    trend: HistoryPoint[];
}

/** React hook to fetch historical risk trend for charting */
export const useRiskTrendChart = () => {
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const fetchTrend = async () => {
            try {
                // 🔹 Hit your Node health route, NOT the ML predict route
                const res = await axiosClient.get<RiskTrendResponse>(
                    "/api/health/risk-trend"
                );

                if (!active) return;

                setData(res.data?.trend ?? []);
            } catch (err) {
                console.error("[useRiskTrendChart] Failed to load trend:", err);
                if (active) setError("Failed to load historical trend");
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchTrend();

        return () => {
            active = false;
        };
    }, []);

    return { data, loading, error };
};

export default useRiskTrendChart;
