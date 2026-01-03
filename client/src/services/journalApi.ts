// client/src/services/journalApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**-----------------------------------------
    Interfaces and Types for Journal API
--------------------------------------------*/
// Journal Entry Interface definition
export interface JournalEntry {
    _id?: string;
    userId?: string;

    prompt?: string;
    text: string;

    mood?: string;
    stress?: number;
    calm?: number;
    happy?: number;
    urgeIntensity?: number;

    createdAt?: string;
    updatedAt?: string;
}

// Response Interfaces for Journal API operations
export interface JournalCreateResponse {
    ok: boolean;
    entry?: JournalEntry;
    error?: string;
    message?: string;
}

// Response for listing journal entries with pagination info
export interface JournalListResponse {
    ok: boolean;
    count: number;
    entries: JournalEntry[];
    error?: string;
    message?: string;
}

// Response for updating a journal entry
export interface JournalUpdateResponse {
    ok: boolean;
    updated?: JournalEntry;
    error?: string;
    message?: string;
}

// Query parameters for listing journal entries with pagination and sorting options
export interface JournalListQuery {
    page?: number;
    limit?: number;
    sort?: string;
}

// Base URL for Journal API endpoints
const JOURNAL_BASE = "/journal";

/**---------------------------------------------------------------
    Raw API functions for Journal operations (without logging)
------------------------------------------------------------------*/
// Create a new journal entry
async function rawCreate(entry: JournalEntry): Promise<JournalCreateResponse> {
    // Send POST request to create a new journal entry and return the response data
    const res = await axiosClient.post<JournalCreateResponse>(JOURNAL_BASE, entry);
    return res.data;
}

// List journal entries with optional query parameters for pagination and sorting
async function rawList(params: JournalListQuery = {}): Promise<JournalListResponse> {
    // Send GET request to retrieve journal entries with query parameters and return the response data
    const res = await axiosClient.get<JournalListResponse>(JOURNAL_BASE, { params });
    return res.data;
}

// Update an existing journal entry by ID with partial entry data
async function rawUpdate(id: string, entry: Partial<JournalEntry>): Promise<JournalUpdateResponse> {
    // Send PUT request to update the journal entry identified by the given ID with the new data
    const res = await axiosClient.put<JournalUpdateResponse>(`${JOURNAL_BASE}/${id}`, entry);
    return res.data;
}

// Exported Journal API with logging wrappers around raw functions
export const journalApi = {
    create: withLogging(rawCreate, { category: "ui", action: "journal_create" }),
    list: withLogging(rawList, { category: "ui", action: "journal_list" }),
    update: withLogging(rawUpdate, { category: "ui", action: "journal_update" }),
};

export default journalApi;
