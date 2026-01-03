// client/src/hooks/useSummary.ts
"use client";

import { useState } from "react";
import {
    summaryApi,
    type WeeklySummaryResponse
} from "@/services";
import { useLogger } from "@/hooks";


/**------------------------------------------------
    Hook for triggering weekly summary dispatch
    POST /summary/weekly
---------------------------------------------------*/
export const useSummary = () => {
    // State management for loading and last result of the summary dispatch operation
    const [loading, setLoading] = useState(false);
    const [lastResult, setLastResult] = useState<WeeklySummaryResponse | null>(null);

    // Logger for tracking operations and errors related to summary dispatch
    const { log, error: logError } = useLogger(false);

    // Function to send weekly summaries to users and handle the response and errors appropriately
    const sendWeekly = async () => {
        // Indicate that the operation is in progress
        setLoading(true);
        try {
            // Call the API to send weekly summaries
            const res = await summaryApi.sendWeekly();
            setLastResult(res);

            // Log the result of the operation
            void log("Weekly summaries triggered", {
                ok: res.ok,
                successCount: res.successCount,
                failedCount: res.failedCount,
            });

            return res;
        } catch (err: unknown) {
            // Log any errors that occur during the operation
            void logError("Weekly summary trigger failed", {
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        } finally {
            // Reset loading state
            setLoading(false);
        }
    };

    return { sendWeekly, loading, lastResult };
};

export default useSummary;
