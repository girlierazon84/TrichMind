// client/src/services/alertApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**----------------------------------------------
    Types for Send Relapse Alert API response
-------------------------------------------------*/
// Success response type
export type SendRelapseAlertSuccess = {
    ok: true;
    sent: boolean;
    message: string;
};

// Error response type
export type SendRelapseAlertError = {
    ok: false;
    error: string;
    message: string;
    details?: unknown;
};

// Union type for the API response
export type SendRelapseAlertResponse = SendRelapseAlertSuccess | SendRelapseAlertError;

/**-------------------------
    POST /alerts/relapse
    Auth required
    Body: { score }
----------------------------*/
// Raw function to send relapse alert
async function rawSendRelapse(score: number): Promise<SendRelapseAlertResponse> {
    // Make POST request to send relapse alert
    const res = await axiosClient.post<SendRelapseAlertResponse>("/alerts/relapse", { score });
    return res.data;
}

// Exported API object with logging
export const alertApi = {
    // Send relapse alert with logging
    sendRelapse: withLogging(rawSendRelapse, {
        category: "alert",
        action: "alerts_sendRelapse",
    }),
};

export default alertApi;
