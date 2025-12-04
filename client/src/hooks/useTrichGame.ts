// client/src/hooks/useTrichGame.ts

import { useCallback, useState } from "react";
import {
    trichGameApi,
    type GameSession,
    type GameSessionListQuery,
} from "@/services";
import { useLogger } from "@/hooks";


/**--------------------------------------
    Hook to manage TrichGame sessions
-----------------------------------------*/
export const useTrichGame = () => {
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Start a new game session
    const startSession = useCallback(
        async (session: GameSession) => {
            setLoading(true);
            setError(null);
            try {
                const res = await trichGameApi.startSession(session);
                const created = res.session;
                setSessions((prev) => [created, ...prev]);
                await log("Game session started", {
                    game: created.gameName,
                    mode: created.mode,
                });
                return created;
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to start game session.";
                setError(msg);
                await logError("Game session start failed", {
                    error: msg,
                    payload: { gameName: session.gameName, mode: session.mode },
                });
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [log, logError]
    );

    // Fetch existing sessions (for insights/chart)
    const fetchSessions = useCallback(
        async (query?: GameSessionListQuery) => {
            setLoading(true);
            setError(null);
            try {
                const res = await trichGameApi.listSessions(
                    query ?? { page: 1, limit: 20, sort: "-createdAt" }
                );
                setSessions(res.sessions);
                await log("Game sessions fetched", { count: res.count });
                return res.sessions;
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch game sessions.";
                setError(msg);
                await logError("Game sessions fetch failed", { error: msg });
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [log, logError]
    );

    // Update / complete a session
    const completeSession = useCallback(
        async (id: string, patch: Partial<GameSession>) => {
            setLoading(true);
            setError(null);
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
            } catch (err) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : "Failed to update game session.";
                setError(msg);
                await logError("Game session update failed", {
                    error: msg,
                    sessionId: id,
                    patch,
                });
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [log, logError]
    );

    return {
        startSession,
        fetchSessions,
        completeSession,
        sessions,
        loading,
        error,
    };
};

export default useTrichGame;
