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

async function rawStart(session: GameSession) {
    const res = await axiosClient.post("/api/game", session);
    return res.data;
}

export const trichGameApi = {
    startSession: withLogging(rawStart, {
        category: "ui",
        action: "startGame",
        showToast: true,
        successMessage: "Game session started!",
    }),
};
