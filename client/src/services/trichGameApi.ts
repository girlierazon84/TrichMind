// client/src/services/trichGameApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";


/**-------------------------------------------------
    Represents a game session in the Trich Game.
----------------------------------------------------*/
// GameSession interface
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

// Query parameters for listing game sessions
export interface GameSessionListQuery {
    page?: number;
    limit?: number;
    sort?: string;
}

// Response interfaces
export interface GameSessionCreateResponse {
    ok: boolean;
    session: GameSession;
}

// Response for listing game sessions
export interface GameSessionListResponse {
    ok: boolean;
    count: number;
    sessions: GameSession[];
}

// Response for updating a game session
export interface GameSessionUpdateResponse {
    ok: boolean;
    updated: GameSession;
}

// Base endpoint for game sessions
const GAMES_BASE = "/games";

/**-------------------------------
    Starts a new game session.
----------------------------------*/
// Raw function to start a game session
async function rawStart(session: GameSession): Promise<GameSessionCreateResponse> {
    // axiosClient baseURL already includes /api → use /games here
    const res = await axiosClient.post(GAMES_BASE, session);
    return res.data as GameSessionCreateResponse;
}

// Raw function to list game sessions
async function rawList(
    params: GameSessionListQuery = {}
): Promise<GameSessionListResponse> {
    const res = await axiosClient.get(GAMES_BASE, { params });
    return res.data as GameSessionListResponse;
}

// Raw function to update a game session
async function rawUpdate(
    id: string,
    patch: Partial<GameSession>
): Promise<GameSessionUpdateResponse> {
    const res = await axiosClient.put(`${GAMES_BASE}/${id}`, patch);
    return res.data as GameSessionUpdateResponse;
}

/**------------------------------------------
    Trich Game API with logging wrappers.
---------------------------------------------*/
export const trichGameApi = {
    startSession: withLogging(rawStart, {
        category: "ui",
        action: "startGame",
        showToast: true,
        successMessage: "Game session started!",
        errorMessage: "Failed to start game session.",
    }),
    listSessions: withLogging(rawList, {
        category: "ui",
        action: "listGameSessions",
        showToast: false,
    }),
    updateSession: withLogging(rawUpdate, {
        category: "ui",
        action: "updateGameSession",
        showToast: false,
        errorMessage: "Failed to update game session.",
    }),
};

export default trichGameApi;
