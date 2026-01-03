// client/src/services/triggersInsightsApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**--------------------------------------------------
    Interfaces and Types for Trigger Insights API
-----------------------------------------------------*/
// Represents a Trigger Insight object from the API response
export interface TriggersInsightsData {
    _id?: string;
    userId?: string;

    name: string;
    frequency?: number;

    createdAt?: string;
    updatedAt?: string;
}

// Query parameters for listing Trigger Insights from the API endpoint
export interface TriggersListQuery {
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

// Response structure for creating a Trigger Insight via the API endpoint
export interface TriggersCreateResponse {
    ok: boolean;
    trigger?: TriggersInsightsData;
    error?: string;
    message?: string;
}

// Response structure for listing Trigger Insights via the API endpoint
export interface TriggersListResponse {
    ok: boolean;
    count: number;
    triggers: TriggersInsightsData[];
    error?: string;
    message?: string;
}

// Response structure for updating a Trigger Insight via the API endpoint
export interface TriggersUpdateResponse {
    ok: boolean;
    updated?: TriggersInsightsData;
    error?: string;
    message?: string;
}

// Base URL for Trigger Insights API endpoints
const TRIGGERS_BASE = "/triggers";

/**-------------------------------------------------------
    Raw API functions for Trigger Insights (endpoints)
----------------------------------------------------------*/
// Create a new Trigger Insight via the API endpoint
async function rawCreate(data: Pick<TriggersInsightsData, "name" | "frequency">): Promise<TriggersCreateResponse> {
    // Send a POST request to create a new Trigger Insight
    const res = await axiosClient.post<TriggersCreateResponse>(TRIGGERS_BASE, data);
    return res.data;
}

// List Trigger Insights via the API endpoint with optional query parameters
async function rawList(params: TriggersListQuery = {}): Promise<TriggersListResponse> {
    // Send a GET request to retrieve a list of Trigger Insights with query parameters
    const res = await axiosClient.get<TriggersListResponse>(TRIGGERS_BASE, { params });
    return res.data;
}

// Update an existing Trigger Insight via the API endpoint by ID
async function rawUpdate(
    id: string,
    data: Partial<Pick<TriggersInsightsData, "name" | "frequency">>
): Promise<TriggersUpdateResponse> {
    // Send a PUT request to update the specified Trigger Insight by ID
    const res = await axiosClient.put<TriggersUpdateResponse>(`${TRIGGERS_BASE}/${id}`, data);
    return res.data;
}

// Export the API functions wrapped with logging functionality for better tracking
export const triggersApi = {
    create: withLogging(rawCreate, { category: "ui", action: "triggers_create" }),
    list: withLogging(rawList, { category: "ui", action: "triggers_list" }),
    update: withLogging(rawUpdate, { category: "ui", action: "triggers_update" }),
};

export default triggersApi;
