// client/src/services/trichBotApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

/**---------------------------------
    TrichBot API Types & Methods
------------------------------------*/


// TrichBot Message type (mirrors server ITrichBotMessage)
export interface TrichBotMessage {
    _id?: string;
    prompt: string;
    response?: string;
    tips?: string[];
    riskScore?: number;
    intent?: string;
    modelInfo?: {
        name?: string;
        version?: string;
    };
    feedback?: {
        helpful?: boolean;
        rating?: number;
        comment?: string;
    };
    createdAt?: string;
}

// Response types
interface ListResponse {
    ok: boolean;
    count: number;
    messages: TrichBotMessage[];
}

interface CreateResponse {
    ok: boolean;
    message: TrichBotMessage;
}

interface FeedbackResponse {
    ok: boolean;
    message: TrichBotMessage;
}

interface ClearHistoryResponse {
    ok: boolean;
    deletedCount: number;
}

// Base path for TrichBot API
// axiosClient baseURL already includes `/api`
const BOT_BASE = "/trichbot";

/* -------------------------------
 *  Raw API functions
 * ------------------------------*/

// Create / send message
async function rawSendMessage(payload: {
    prompt: string;
    intent?: string;
}): Promise<TrichBotMessage> {
    const res = await axiosClient.post<CreateResponse>(BOT_BASE, payload);
    return res.data.message;
}

// Feedback API
async function rawFeedback(
    id: string,
    data: TrichBotMessage["feedback"]
): Promise<TrichBotMessage> {
    const res = await axiosClient.put<FeedbackResponse>(
        `${BOT_BASE}/${id}/feedback`,
        data
    );
    return res.data.message;
}

// List messages API
async function rawList(params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<TrichBotMessage[]> {
    const res = await axiosClient.get<ListResponse>(BOT_BASE, { params });
    return res.data.messages;
}

// Clear chat history API
async function rawClearHistory(): Promise<number> {
    const res = await axiosClient.delete<ClearHistoryResponse>(
        `${BOT_BASE}/history`
    );
    return res.data.deletedCount;
}

/**----------------------------------
    Exported TrichBot API Service
-------------------------------------*/
export const trichBotApi = {
    // Send Message API
    sendMessage: withLogging(rawSendMessage, {
        category: "ml",
        action: "sendMessage",
        showToast: false,
        errorMessage: "TrichBot is currently unavailable.",
    }),

    // Feedback API
    feedback: withLogging(rawFeedback, {
        category: "ml",
        action: "botFeedback",
        showToast: true,
        successMessage: "Feedback sent! Thank you 🌿",
        errorMessage: "Failed to send feedback.",
    }),

    // List Messages API
    list: withLogging(rawList, {
        category: "ml",
        action: "botList",
        showToast: false,
        errorMessage: "Failed to load previous TrichBot messages.",
    }),

    // Clear chat history API
    clearHistory: withLogging(rawClearHistory, {
        category: "ml",
        action: "botClearHistory",
        showToast: true,
        successMessage: "Chat history cleared.",
        errorMessage: "Failed to clear TrichBot history.",
    }),
};

export default trichBotApi;
