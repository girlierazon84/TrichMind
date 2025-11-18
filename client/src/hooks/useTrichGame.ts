// client/src/hooks/useTrichGame.ts

import { useState } from "react";
import {
    trichGameApi,
    type GameSession
} from "@/services";
import { useLogger } from "@/hooks";


// ─────────────────────────────────────
// Hook to manage TrichGame sessions
// ─────────────────────────────────────
export const useTrichGame = () => {
    // Loading state
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    // Start a new game session
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

export default useTrichGame;