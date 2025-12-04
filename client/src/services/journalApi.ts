// client/src/services/journalApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**----------------------------
    Journal entry interface
-------------------------------*/
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

// axiosClient baseURL already includes /api → use /journal here
const JOURNAL_BASE = "/journal";

/**---------------------------
    Journal API functions
------------------------------*/
// Raw API functions without logging
async function rawCreate(entry: JournalEntry) {
    const res = await axiosClient.post(JOURNAL_BASE, entry);
    return res.data;
}

// List journal entries with optional pagination and sorting
async function rawList(params?: { page?: number; limit?: number; sort?: string }) {
    const res = await axiosClient.get(JOURNAL_BASE, { params });
    return res.data;
}

// Update a journal entry by ID
async function rawUpdate(id: string, entry: Partial<JournalEntry>) {
    const res = await axiosClient.put(`${JOURNAL_BASE}/${id}`, entry);
    return res.data;
}

// Remove a journal entry by ID
async function rawRemove(id: string) {
    const res = await axiosClient.delete(`${JOURNAL_BASE}/${id}`);
    return res.data;
}

/**------------------------------
    Journal API with logging
---------------------------------*/
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

export default journalApi;