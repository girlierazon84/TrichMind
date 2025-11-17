// client/src/hooks/usePredictedRiskTrend.ts

import { useEffect, useState } from "react";
import axios from "@/services/axiosClient";


// Hook to fetch predicted risk trend from ML service
export const usePredictedRiskTrend = (days: number = 14) => {
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`http://localhost:8000/risk-trend?days=${days}`)
            .then(res => setTrend(res.data.trend))
            .catch(err => console.error("ML risk trend error:", err))
            .finally(() => setLoading(false));
    }, [days]);

    return { trend, loading };
};
