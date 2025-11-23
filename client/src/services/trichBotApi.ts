// client/src/services/trichBotApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

/**------------------------------------
    -- TrichBot API Types & Methods
---------------------------------------*/
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

// Create and Feedback response types
interface CreateResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// Feedback response type
interface FeedbackResponse {
    ok: boolean;
    message: TrichBotMessage;
}

// API Methods
async function rawSendMessage(payload: { prompt: string; intent?: string }) {
    const res = await axiosClient.post<CreateResponse>("/api/trichbot", payload);
    return res.data.message;
}

// Feedback API
async function rawFeedback(id: string, data: TrichBotMessage["feedback"]) {
    const res = await axiosClient.put<FeedbackResponse>(
        `/api/trichbot/${id}/feedback`,
        data
    );
    return res.data.message;
}

// List Messages API
async function rawList(params?: { page?: number; limit?: number; sort?: string }) {
    const res = await axiosClient.get<ListResponse>("/api/trichbot", { params });
    return res.data.messages;
}

/**-------------------------------------
    -- Exported TrichBot API Service
----------------------------------------*/
export const trichBotApi = {
    sendMessage: withLogging(rawSendMessage, {
        category: "ml",
        action: "sendMessage",
        showToast: false,
    }),
    feedback: withLogging(rawFeedback, {
        category: "ml",
        action: "botFeedback",
        showToast: true,
        successMessage: "Feedback sent! Thank you 🌿",
    }),
    list: withLogging(rawList, {
        category: "ml",
        action: "botList",
        showToast: false,
    }),
};

export default trichBotApi;
