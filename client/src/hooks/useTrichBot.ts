// client/src/hooks/useTrichBot.ts

import { useState } from "react";
import { trichBotApi } from "@/services/trichBotApi";
import { useLogger } from "@/hooks/useLogger";

export function useTrichBot() {
    const [loading, setLoading] = useState(false);
    const { log } = useLogger(false);

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
