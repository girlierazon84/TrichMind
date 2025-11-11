// client/src/services/journalApi.ts

import { axiosClient } from "./axiosClient";
import { withLogging } from "@/utils/withLogging";

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

async function rawCreate(entry: JournalEntry) {
    const res = await axiosClient.post("/journal", entry);
    return res.data;
}

async function rawList(params?: { page?: number; limit?: number; sort?: string }) {
    const res = await axiosClient.get("/journal", { params });
    return res.data;
}

async function rawUpdate(id: string, entry: Partial<JournalEntry>) {
    const res = await axiosClient.put(`/journal/${id}`, entry);
    return res.data;
}

async function rawRemove(id: string) {
    const res = await axiosClient.delete(`/journal/${id}`);
    return res.data;
}

export const journalApi = {
    create: withLogging(rawCreate, {
        category: "ui",
        action: "journalCreate",
        showToast: true,
        successMessage: "Journal entry saved!",
        errorMessage: "Failed to save entry.",
    }),
    list: withLogging(rawList, { category: "ui", action: "journalList" }),
    update: withLogging(rawUpdate, {
        category: "ui",
        action: "journalUpdate",
        showToast: true,
        successMessage: "Journal entry updated!",
    }),
    remove: withLogging(rawRemove, {
        category: "ui",
        action: "journalRemove",
        showToast: true,
        successMessage: "Entry deleted.",
    }),
};
