// client/src/services/trichGameApi.ts
"use client";

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**--------------------------------------
    Game Session Interfaces and Types
-----------------------------------------*/
// Represents a game session with various attributes
export interface GameSession {
    _id?: string;
    gameName: string;
    mode?: string;
    score?: number;
    streak?: number;
    durationSeconds?: number;
    startedAt?: string;
    endedAt?: string;
    completed?: boolean;
    metadata?: Record<string, unknown>;
}

// Response structure for creating a game session
export interface GameSessionCreateResponse {
    ok: boolean;
    session: GameSession;
}

// Response structure for listing game sessions with pagination info
export interface GameSessionListResponse {
    ok: boolean;
    count: number;
    sessions: GameSession[];
}

// Response structure for updating a game session
export interface GameSessionUpdateResponse {
    ok: boolean;
    updated: GameSession;
}

// Query parameters for listing game sessions with pagination and sorting options
export interface GameSessionListQuery {
    page?: number;
    limit?: number;
    sort?: string;
}

// Base URL for game session related API endpoints
const GAMES_BASE = "/games";

/**----------------------------------------
    Raw API Functions for Game Sessions
-------------------------------------------*/
// Function to start a new game session by sending a POST request to the server
async function rawStart(session: GameSession): Promise<GameSessionCreateResponse> {
    // Send a POST request to create a new game session and return the response data
    const res = await axiosClient.post<GameSessionCreateResponse>(GAMES_BASE, session);
    return res.data;
}

// Function to list game sessions with optional query parameters for pagination and sorting
async function rawList(params: GameSessionListQuery = {}): Promise<GameSessionListResponse> {
    // Send a GET request to retrieve game sessions based on the provided query parameters and return the response data
    const res = await axiosClient.get<GameSessionListResponse>(GAMES_BASE, { params });
    return res.data;
}

// Function to update an existing game session by sending a PUT request with the session ID and patch data
async function rawUpdate(id: string, patch: Partial<GameSession>): Promise<GameSessionUpdateResponse> {
    // Send a PUT request to update the specified game session and return the response data
    const res = await axiosClient.put<GameSessionUpdateResponse>(`${GAMES_BASE}/${id}`, patch);
    return res.data;
}

// Exporting the trichGameApi object with logging wrappers around the raw API functions for better traceability
export const trichGameApi = {
    startSession: withLogging(rawStart, { category: "game", action: "game_startSession" }),
    listSessions: withLogging(rawList, { category: "game", action: "game_listSessions" }),
    updateSession: withLogging(rawUpdate, { category: "game", action: "game_updateSession" }),
};

export default trichGameApi;
