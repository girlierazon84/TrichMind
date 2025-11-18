// client/src/hooks/useTrichBot.ts

import { useState } from "react";
import { trichBotApi } from "@/services";
import { useLogger } from "@/hooks";


// ─────────────────────────────────────
// Hook to manage TrichBot interactions
// ─────────────────────────────────────
export const useTrichBot = () => {
    // Loading state
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

    // Send a message to TrichBot
    const sendMessage = async (prompt: string) => {
        setLoading(true);
        try {
            const response = await trichBotApi.sendMessage({ prompt });
            await log("TrichBot interaction", { prompt });
            return response;
        } finally {
            setLoading(false);
        }
    };

    return { sendMessage, loading };
}

export default useTrichBot;