// client/src/api/trichBotApi.ts

import { axiosClient } from "./axiosClient";

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

export const trichBotApi = {
    /** 🤖 Create AI chat message */
    sendMessage: async (message: Omit<TrichBotMessage, "_id" | "createdAt">) => {
        const res = await axiosClient.post("/trichbot", message);
        return res.data;
    },

    /** 💬 Get message history */
    list: async (params?: { page?: number; limit?: number }) => {
        const res = await axiosClient.get("/trichbot", { params });
        return res.data;
    },

    /** 🧠 Submit feedback */
    feedback: async (id: string, data: TrichBotMessage["feedback"]) => {
        const res = await axiosClient.put(`/trichbot/${id}/feedback`, data);
        return res.data;
    },
};
