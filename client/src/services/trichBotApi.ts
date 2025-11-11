// client/src/services/trichBotApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils/withLogging";


export interface TrichBotMessage {
    _id?: string;
    prompt: string;
    response?: string;
    tips?: string[];
    riskScore?: number;
    intent?: string;
    feedback?: {
        helpful?: boolean;
        rating?: number;
        comment?: string;
    };
    createdAt?: string;
}

async function rawSendMessage(message: Omit<TrichBotMessage, "_id" | "createdAt">) {
    const res = await axiosClient.post("/trichbot", message);
    return res.data;
}

async function rawFeedback(id: string, data: TrichBotMessage["feedback"]) {
    const res = await axiosClient.put(`/trichbot/${id}/feedback`, data);
    return res.data;
}

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
};
