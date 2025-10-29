// client/src/api/journalApi.ts

import { axiosClient } from "./axiosClient";

export interface JournalEntry {
    _id?: string;
    prompt?: string;
    text: string;
    mood?: string;
    stress?: number;
    calm?: number;
    happy?: number;
    urgeIntensity?: number;
    createdAt?: string;
}

export const journalApi = {
    /** 📝 Create a new journal entry */
    create: async (entry: JournalEntry) => {
        const res = await axiosClient.post("/journal", entry);
        return res.data;
    },

    /** 📘 Fetch all user journal entries */
    list: async (params?: { page?: number; limit?: number; sort?: string }) => {
        const res = await axiosClient.get("/journal", { params });
        return res.data;
    },

    /** ✏️ Update an existing entry */
    update: async (id: string, entry: Partial<JournalEntry>) => {
        const res = await axiosClient.put(`/journal/${id}`, entry);
        return res.data;
    },

    /** ❌ Delete entry */
    remove: async (id: string) => {
        const res = await axiosClient.delete(`/journal/${id}`);
        return res.data;
    },
};
