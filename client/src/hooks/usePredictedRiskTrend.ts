// client/src/hooks/usePredictedRiskTrend.ts
"use client";

import { useEffect, useState } from "react";
import { axiosClient } from "@/services";


/**-----------------------------------------------------------------
    Hook to fetch predicted risk trend data from the ML endpoint
--------------------------------------------------------------------*/
// Define the structure of a predicted point in the trend data returned by the API interface PredictedPoint 
export interface PredictedPoint {
    day: number;
    predicted_risk: number;
}

// Define the structure of the response from the ML trend API
interface MLTrendResponse {
    trend: PredictedPoint[];
}

// Hook to fetch predicted risk trend data
export const usePredictedRiskTrend = (days: number = 14) => {
    // State to hold the trend data, loading status, and any error message
    const [trend, setTrend] = useState<PredictedPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to fetch trend data when the component mounts or when 'days' changes
    useEffect(() => {
        // To prevent state updates on unmounted component
        let alive = true;

        // Async function to fetch trend data from the API
        const fetchTrend = async () => {
            // Initialize loading state and clear previous errors
            setLoading(true);
            setError(null);

            // Make the API call to fetch the trend data
            try {
                // Call the ML trend endpoint with the specified number of days
                const res = await axiosClient.get<MLTrendResponse>(`/ml/risk-trend?days=${days}`);
                if (!alive) return;
                setTrend(res.data?.trend ?? []);
            } catch (err) {
                // Log the error and set the error state
                console.error("[usePredictedRiskTrend] Failed to load trend:", err);
                if (alive) setError("Failed to load predicted risk trend");
            } finally {
                // Update loading state if the component is still mounted
                if (alive) setLoading(false);
            }
        };

        // Invoke the fetch function and set up cleanup to mark component as unmounted on unmount
        void fetchTrend();
        return () => {
            alive = false;
        };
    }, [days]);

    return { trend, loading, error };
};

export default usePredictedRiskTrend;
