// client/src/services/trichGameApi.ts

import { axiosClient } from "@/services";
import { withLogging } from "@/utils";

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

export interface GameSessionListQuery {
    page?: number;
    limit?: number;
    sort?: string;
}

export interface GameSessionCreateResponse {
    ok: boolean;
    session: GameSession;
}

export interface GameSessionListResponse {
    ok: boolean;
    count: number;
    sessions: GameSession[];
}

export interface GameSessionUpdateResponse {
    ok: boolean;
    updated: GameSession;
}

async function rawStart(session: GameSession): Promise<GameSessionCreateResponse> {
    const res = await axiosClient.post("/api/games", session);
    return res.data as GameSessionCreateResponse;
}

async function rawList(
    params: GameSessionListQuery = {}
): Promise<GameSessionListResponse> {
    const res = await axiosClient.get("/api/games", { params });
    return res.data as GameSessionListResponse;
}

async function rawUpdate(
    id: string,
    patch: Partial<GameSession>
): Promise<GameSessionUpdateResponse> {
    const res = await axiosClient.put(`/api/games/${id}`, patch);
    return res.data as GameSessionUpdateResponse;
}

export const trichGameApi = {
    startSession: withLogging(rawStart, {
        category: "ui",
        action: "startGame",
        showToast: true,
        successMessage: "Game session started!",
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
    }),
};
