// client/src/hooks/useRiskTrendChart.ts

import { useEffect, useState, useCallback } from "react";
import { axiosClient } from "@/services";


export interface RiskTrendPoint {
    date: string;
    risk_score: number;
}

interface UseRiskTrendChartResult {
    data: RiskTrendPoint[];
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export const useRiskTrendChart = (): UseRiskTrendChartResult => {
    const [data, setData] = useState<RiskTrendPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTrend = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const res = await axiosClient.get<RiskTrendPoint[]>(
                "/api/health/risk-trend"
            );
            const payload = res.data || [];

            const sorted = payload.slice().sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            setData(sorted);
        } catch (err) {
            const msg =
                (err as { message?: string })?.message ||
                "Failed to load trend data.";
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
