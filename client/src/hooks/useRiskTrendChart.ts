// client/src/hooks/useRiskTrendChart.ts

import { useState, useEffect } from "react";
import apiClient from "@/services/axiosClient";

export interface HistoryPoint {
    date: string;
    score: number;
}

export const useRiskTrendChart = () => {
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const fetchTrend = async () => {
            try {
                const res = await apiClient.get<{ trend: HistoryPoint[] }>("/health/risk-trend");

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
