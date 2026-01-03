// client/src/services/summaryApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


// Response type for the weekly summary API
export interface WeeklySummaryResponse {
    ok: boolean;
    message: string;
    successCount: number;
    failedCount: number;

    error?: string;
    details?: unknown;
}

/**---------------------------------------------------------------
    POST /summary/weekly
    Auth may be required depending on your backend middleware.
------------------------------------------------------------------*/
async function rawSendWeekly(): Promise<WeeklySummaryResponse> {
    // Make the POST request to trigger weekly summaries
    const res = await axiosClient.post<WeeklySummaryResponse>("/summary/weekly");
    return res.data;
}

// Wrap the raw function with logging capabilities for better observability
export const summaryApi = {
    // Function to send weekly summaries with logging
    sendWeekly: withLogging(rawSendWeekly, {
        // Logging metadata
        category: "summary",
        action: "summary_sendWeekly",
        // optionally:
        // showToast: true,
        // successMessage: "Weekly summaries triggered!",
    }),
};

export default summaryApi;
