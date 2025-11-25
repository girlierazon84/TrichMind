// client/src/hooks/useTrichGame.ts

import { useCallback, useState } from "react";
import {
    trichGameApi,
    type GameSession,
    type GameSessionListQuery,
} from "@/services";
import { useLogger } from "@/hooks";

// ─────────────────────────────────────
// Hook to manage TrichGame sessions
// ─────────────────────────────────────
export const useTrichGame = () => {
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const { log } = useLogger(false);

    // Start a new game session
    const startSession = useCallback(
        async (session: GameSession) => {
            setLoading(true);
            try {
                const res = await trichGameApi.startSession(session);
                const created = res.session;
                setSessions((prev) => [created, ...prev]);
                await log("Game session started", { game: created.gameName, mode: created.mode });
                return created;
            } finally {
                setLoading(false);
            }
        },
        [log]
    );

    // Fetch existing sessions (for insights/chart)
    const fetchSessions = useCallback(
        async (query?: GameSessionListQuery) => {
            setLoading(true);
            try {
                const res = await trichGameApi.listSessions(query ?? { page: 1, limit: 20, sort: "-createdAt" });
                setSessions(res.sessions);
                await log("Game sessions fetched", { count: res.count });
                return res.sessions;
            } finally {
                setLoading(false);
            }
        },
        [log]
    );

    // Update / complete a session
    const completeSession = useCallback(
        async (id: string, patch: Partial<GameSession>) => {
            setLoading(true);
            try {
                const res = await trichGameApi.updateSession(id, patch);
                const updated = res.updated;
                setSessions((prev) =>
                    prev.map((s) => (s._id === updated._id ? updated : s))
                );
                await log("Game session updated", {
                    sessionId: id,
                    completed: patch.completed ?? updated.completed,
                });
                return updated;
            } finally {
                setLoading(false);
            }
        },
        [log]
    );

    return {
        startSession,
        fetchSessions,
        completeSession,
        sessions,
        loading,
    };
};

export default useTrichGame;
