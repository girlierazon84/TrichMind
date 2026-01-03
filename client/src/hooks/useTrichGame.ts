// client/src/hooks/useTrichGame.ts
"use client";

import { useCallback, useState } from "react";
import {
    trichGameApi,
    type GameSession,
    type GameSessionListQuery
} from "@/services";
import { useLogger } from "@/hooks";


/**----------------------------------------------------------------------
    Hook to manage trichotillomania game sessions
    Toasts should be handled in API layer or UI, not duplicated here.
-------------------------------------------------------------------------*/
// Function to manage trichotillomania game sessions using React hooks
export const useTrichGame = () => {
    // State variables to manage loading state, game sessions, and error messages
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { log, error: logError } = useLogger(false);

    // Function to start a new game session
    const startSession = useCallback(
        async (session: GameSession) => {
            // Set loading state and clear previous errors
            setLoading(true);
            setError(null);
            // Attempt to start a new game session via the API
            try {
                // Call the API to start a new game session
                const res = await trichGameApi.startSession(session);
                const created = res.session;
                setSessions((prev) => [created, ...prev]);
                void log("Game session started", { game: created.gameName, mode: created.mode });
                return created;
            } catch (err: unknown) {
                // Handle errors by logging and setting error state
                const msg = err instanceof Error ? err.message : "Failed to start game session.";
                setError(msg);
                void logError("Game session start failed", { error: msg, payload: { gameName: session.gameName, mode: session.mode } });
                throw err;
            } finally {
                // Reset loading state
                setLoading(false);
            }
        },
        [log, logError]
    );

    // Function to fetch game sessions with optional query parameters
    const fetchSessions = useCallback(
        async (query?: GameSessionListQuery) => {
            // Set loading state and clear previous errors
            setLoading(true);
            setError(null);
            try {
                // Call the API to fetch game sessions
                const res = await trichGameApi.listSessions(query ?? { page: 1, limit: 20, sort: "-createdAt" });
                setSessions(res.sessions);
                void log("Game sessions fetched", { count: res.count });
                return res.sessions;
            } catch (err: unknown) {
                // Handle errors by logging and setting error state
                const msg = err instanceof Error ? err.message : "Failed to fetch game sessions.";
                setError(msg);
                void logError("Game sessions fetch failed", { error: msg });
                throw err;
            } finally {
                // Reset loading state
                setLoading(false);
            }
        },
        [log, logError]
    );

    // Function to complete or update a game session
    const completeSession = useCallback(
        async (id: string, patch: Partial<GameSession>) => {
            // Set loading state and clear previous errors
            setLoading(true);
            setError(null);
            try {
                // Call the API to update the game session
                const res = await trichGameApi.updateSession(id, patch);
                const updated = res.updated;
                setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
                void log("Game session updated", { sessionId: id, completed: patch.completed ?? updated.completed });
                return updated;
            } catch (err: unknown) {
                // Handle errors by logging and setting error state
                const msg = err instanceof Error ? err.message : "Failed to update game session.";
                setError(msg);
                void logError("Game session update failed", { error: msg, sessionId: id, patch });
                throw err;
            } finally {
                // Reset loading state
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
