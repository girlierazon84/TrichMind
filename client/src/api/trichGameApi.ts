// client/src/api/trichGameApi.ts

import { axiosClient } from "./axiosClient";

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
    metadata?: Record<string, any>;
}

export const trichGameApi = {
    /** 🎮 Start a game session */
    startSession: async (session: GameSession) => {
        const res = await axiosClient.post("/game", session);
        return res.data;
    },

    /** 🧩 Update session (e.g. finish or save progress) */
    updateSession: async (id: string, session: Partial<GameSession>) => {
        const res = await axiosClient.put(`/game/${id}`, session);
        return res.data;
    },

    /** 📜 List user sessions */
    listSessions: async (params?: { page?: number; limit?: number }) => {
        const res = await axiosClient.get("/game", { params });
        return res.data;
    },
};
