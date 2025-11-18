// client/src/hooks/useRiskTrendChart.ts

import { useState, useEffect } from "react";
import { axiosClient } from "@/services";


//----------------------------------------------------------
// Function to fetch historical risk trend data
//----------------------------------------------------------
export const useRiskTrendChart = () => {
    // State variables to hold data, loading status, and error message
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect hook to fetch data on component mount
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
