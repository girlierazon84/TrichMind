// client/src/services/healthApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**------------------------------------
    Health Log Interfaces and Types
---------------------------------------*/
// Represents a health log entry in the system
export interface HealthLogData {
    _id?: string;
    userId?: string;

    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date?: string;

    relapseRisk?: { score?: number };

    createdAt?: string;
    updatedAt?: string;
}

// Data Transfer Object for creating a health log entry in the system
export interface HealthCreateDTO {
    sleepHours: number;
    stressLevel: number;
    exerciseMinutes: number;
    date?: string;
}

// Data Transfer Object for updating a health log entry in the system
export type HealthUpdateDTO = Partial<HealthCreateDTO>;

// Query parameters for listing health log entries in the system with pagination and filtering options
export interface HealthListQuery {
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    sort?: string;
}

// Response structure for creating a health log entry in the system
export interface HealthCreateResponse {
    ok: boolean;
    log?: HealthLogData;
    error?: string;
    message?: string;
}

// Response structure for listing health log entries in the system with pagination details
export interface HealthListResponse {
    ok: boolean;
    count: number;
    logs: HealthLogData[];
    error?: string;
    message?: string;
}

// Response structure for updating a health log entry in the system
export interface HealthUpdateResponse {
    ok: boolean;
    updated?: HealthLogData;
    error?: string;
    message?: string;
}

// Represents a single point in the relapse risk trend over time for the user in the system
export interface RiskTrendPoint {
    date: string;
    score: number;
}

// Response structure for retrieving the relapse risk trend over time for the user in the system
export interface RiskTrendResponse {
    ok: boolean;
    trend: RiskTrendPoint[];
    error?: string;
    message?: string;
}

// Base URL for health log related API endpoints
const HEALTH_BASE = "/health";

/**---------------------------------------------------
    Service Functions for Health Log API Endpoints
------------------------------------------------------*/
// Create a new health log entry in the system
async function rawCreate(data: HealthCreateDTO): Promise<HealthCreateResponse> {
    // Send a POST request to create a new health log entry with the provided data
    const res = await axiosClient.post<HealthCreateResponse>(HEALTH_BASE, data);
    return res.data;
}

// List health log entries in the system with optional query parameters for filtering and pagination
async function rawList(params: HealthListQuery = {}): Promise<HealthListResponse> {
    // Send a GET request to retrieve health log entries with the specified query parameters
    const res = await axiosClient.get<HealthListResponse>(HEALTH_BASE, { params });
    return res.data;
}

// Update an existing health log entry in the system by its ID with the provided data
async function rawUpdate(id: string, data: HealthUpdateDTO): Promise<HealthUpdateResponse> {
    // Send a PUT request to update the health log entry identified by the given ID with the new data
    const res = await axiosClient.put<HealthUpdateResponse>(`${HEALTH_BASE}/${id}`, data);
    return res.data;
}

// Retrieve the relapse risk trend over time for the user in the system
async function rawRiskTrend(): Promise<RiskTrendResponse> {
    // Send a GET request to retrieve the relapse risk trend data for the user
    const res = await axiosClient.get<RiskTrendResponse>(`${HEALTH_BASE}/risk-trend`);
    return res.data;
}

// Export the health API service functions wrapped with logging functionality for tracking user interactions
export const healthApi = {
    create: withLogging(rawCreate, { category: "ui", action: "health_create" }),
    list: withLogging(rawList, { category: "ui", action: "health_list" }),
    update: withLogging(rawUpdate, { category: "ui", action: "health_update" }),
    riskTrend: withLogging(rawRiskTrend, { category: "ui", action: "health_riskTrend" }),
};

export default healthApi;
