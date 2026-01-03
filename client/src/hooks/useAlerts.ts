// client/src/hooks/useAlerts.ts
"use client";

import { useCallback, useState } from "react";
import {
    alertApi,
    type SendRelapseAlertResponse
} from "@/services";


/**---------------------------------------------
    Triggers relapse alert email via backend
    POST /alerts/relapse (auth required)
    Body: { score }
------------------------------------------------*/
// Hook to send relapse alert
export const useAlerts = () => {
    // State for loading, error, and last result
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Store the last result of sending relapse alert
    const [lastResult, setLastResult] = useState<SendRelapseAlertResponse | null>(null);

    // Function to send relapse alert
    const sendRelapse = useCallback(async (score: number) => {
        // Reset state
        setLoading(true);
        setError(null);

        // Call the alert API
        try {
            // Send relapse alert
            const res = await alertApi.sendRelapse(score);
            setLastResult(res);

            // Handle non-ok response
            if (!res.ok) setError(res.message || "Failed to send relapse alert.");
            return res;
        } catch (err: unknown) {
            // Handle network or unexpected errors
            const msg = err instanceof Error ? err.message : "Failed to send relapse alert";
            setError(msg);
            setLastResult({ ok: false, error: "NetworkError", message: msg });
            throw err;
        } finally {
            // Reset loading state
            setLoading(false);
        }
    }, []);

    return { sendRelapse, loading, error, lastResult };
};

export default useAlerts;
