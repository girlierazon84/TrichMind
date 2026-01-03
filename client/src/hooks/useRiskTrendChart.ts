// client/src/hooks/useRiskTrendChart.ts

"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { axiosClient } from "@/services";


// Define the structure of a history point
export interface HistoryPoint {
    date: string;
    score: number;
}

// Custom hook to fetch and manage risk trend chart data
export const useRiskTrendChart = (enabled = true) => {
    // State variables for data, loading status, and error handling
    const [data, setData] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<string | null>(null);

    // Effect to fetch data when the hook is enabled
    useEffect(() => {
        // If not enabled, reset state and exit
        if (!enabled) {
            setLoading(false);
            setData([]);
            return;
        }

        // Create an AbortController to handle request cancellation
        const controller = new AbortController();

        // Async function to fetch trend data
        const fetchTrend = async () => {
            // Set loading state and clear previous errors
            setLoading(true);
            setError(null);

            // Attempt to fetch data from the API
            try {
                // Make GET request to fetch risk trend data
                const res = await axiosClient.get<{ trend: HistoryPoint[] }>("/health/risk-trend", {
                    signal: controller.signal,
                });
                // Update state with fetched data
                setData(res.data?.trend ?? []);
            } catch (err) {
                // ignore aborts
                if ((err as AxiosError)?.name === "CanceledError") return;
                console.error("[useRiskTrendChart] Failed to load trend:", err);
                setError("Failed to load historical trend");
            } finally {
                // Reset loading state
                setLoading(false);
            }
        };

        // Invoke the fetch function
        void fetchTrend();
        return () => controller.abort();
    }, [enabled]);

    return { data, loading, error };
};

export default useRiskTrendChart;
