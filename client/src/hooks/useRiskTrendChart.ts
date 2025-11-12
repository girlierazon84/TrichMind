// client/src/hooks/useRiskTrendChart.ts

import { useEffect, useState, useCallback } from "react";
import { axiosClient } from "@/services";

export interface RiskTrendPoint {
    date: string;        // ISO date string (e.g., "2025-11-12")
    risk_score: number;  // risk level (0–1 or 0–100)
}

interface UseRiskTrendChartResult {
    data: RiskTrendPoint[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Custom hook to fetch relapse risk trend data for visualization.
 * Backend endpoint: GET /health/risk-trend → [{ date, risk_score }]
 */
export const useRiskTrendChart = (): UseRiskTrendChartResult => {
    const [data, setData] = useState<RiskTrendPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrend = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const res = await axiosClient.get<RiskTrendPoint[]>("/health/risk-trend");
            const payload = res.data || [];

            // Ensure dates are sorted (optional, for cleaner chart)
            const sorted = payload.sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            setData(sorted);
        } catch (err: unknown) {
            const msg =
                (err as { message?: string })?.message || "Failed to load trend data.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTrend();
    }, [fetchTrend]);

    return { data, loading, error, refresh: fetchTrend };
};

export default useRiskTrendChart;
