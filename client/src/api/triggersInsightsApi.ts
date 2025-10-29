// client/src/api/triggersInsightsApi.ts

import { axiosClient } from "./axiosClient";

export interface TriggerData {
    _id?: string;
    name: string;
    frequency?: number;
}

export const triggersApi = {
    /** ⚡ Create trigger */
    create: async (data: TriggerData) => {
        const res = await axiosClient.post("/triggers", data);
        return res.data;
    },

    /** 📋 List triggers */
    list: async (params?: { search?: string; page?: number; limit?: number }) => {
        const res = await axiosClient.get("/triggers", { params });
        return res.data;
    },

    /** ✏️ Update trigger */
    update: async (id: string, data: Partial<TriggerData>) => {
        const res = await axiosClient.put(`/triggers/${id}`, data);
        return res.data;
    },

    /** ❌ Delete trigger */
    remove: async (id: string) => {
        const res = await axiosClient.delete(`/triggers/${id}`);
        return res.data;
    },
};
