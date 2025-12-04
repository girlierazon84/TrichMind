// client/src/services/trichBotApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**---------------------------------
    TrichBot API Types & Methods
------------------------------------*/
// TrichBot Message type
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

// Create + feedback response
interface CreateResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// Feedback response
interface FeedbackResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// Base path for TrichBot API
const BOT_BASE = "/trichbot";

// API Methods
async function rawSendMessage(payload: {
    prompt: string;
    intent?: string;
}): Promise<TrichBotMessage> {
    // axiosClient baseURL already includes `/api`
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

// List Messages API
async function rawList(params?: {
    page?: number;
    limit?: number;
    sort?: string;
}): Promise<TrichBotMessage[]> {
    const res = await axiosClient.get<ListResponse>(BOT_BASE, { params });
    return res.data.messages;
}

/**----------------------------------
    Exported TrichBot API Service
-------------------------------------*/
export const trichBotApi = {
    //Send Message API
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
};

export default trichBotApi;
