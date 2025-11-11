// client/src/hooks/useTrichGame.ts

import { useState } from "react";
import { trichGameApi, type GameSession } from "@/services";
import { useLogger } from "@/hooks";

export function useTrichGame() {
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    const startSession = async (session: GameSession) => {
        setLoading(true);
        try {
            const res = await trichGameApi.startSession(session);
            await log("Game session started", { game: session.gameName });
            return res;
        } finally {
            setLoading(false);
        }
    };

    return { startSession, loading };
}
