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
    // State
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effects
    useEffect(() => {
        const fetchTrend = async () => {
            try {
                const res = await axiosClient.get("/api/health/risk-trend");
                setData(res.data?.trend ?? []);
            } catch (err) {
                console.error("[useRiskTrendChart] Failed to load trend:", err);
                setError("Failed to load historical trend");
            } finally {
                setLoading(false);
            }
        };

        fetchTrend();
    }, []);

    return { data, loading, error };
};

export default useRiskTrendChart;
