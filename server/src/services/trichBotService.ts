// server/src/services/trichBotService.ts

import OpenAI from "openai";
import { ENV_AUTO } from "../config";
import { TrichBotMessage, type ITrichBotMessage } from "../models";
import type {
    TrichBotCreateDTO,
    TrichBotListQuery,
    TrichBotFeedbackDTO,
} from "../schemas";
import type { SortOrder } from "mongoose";

// Extend ENV_AUTO at the type level to include OpenAI fields
const ENV_OPENAI = ENV_AUTO as typeof ENV_AUTO & {
    OPENAI_API_KEY?: string;
    OPENAI_MODEL?: string;
};

// OpenAI configuration
const openaiApiKey = ENV_OPENAI.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = ENV_OPENAI.OPENAI_MODEL || "gpt-4.1-mini";

// Initialise OpenAI client (we guard missing key in createMessage)
const openai = new OpenAI({
    apiKey: openaiApiKey || "dummy", // will error at runtime if truly missing
});

// Build messages array for OpenAI chat input
function buildMessages(prompt: string, intent?: string) {
    const system = `
You are TrichBot, a friendly, validating assistant for people with trichotillomania.
- Be gentle, non-judgmental, and hopeful.
- Offer 2–4 concrete coping ideas or micro-actions.
- Avoid medical diagnoses; suggest professional help if needed.
- Keep answers concise but warm.
${intent ? `User intent hint: ${intent}` : ""}
`.trim();

    return [
        { role: "system" as const, content: system },
        { role: "user" as const, content: prompt },
    ];
}

// Extract text response from OpenAI response object
function extractText(resp: any): string {
    // For OpenAI Responses API (GPT-4.1 family):
    const first = resp.output?.[0];
    if (first && "content" in first) {
        const textPart = first.content?.find((p: any) => p.type === "output_text");
        if (textPart?.text) return textPart.text;
    }

    // Fallback for ChatCompletion-style responses
    const choice = resp.choices?.[0];
    return (
        choice?.message?.content ||
        resp.output_text?.[0]?.content?.[0]?.text ||
        "I'm here for you. 💚"
    );
}

/**---------------------
    TrichBot Service
------------------------*/
export const botService = {
    // Create a new message: call LLM, store Mongo doc, return doc
    async createMessage(
        userId: string,
        data: TrichBotCreateDTO
    ): Promise<ITrichBotMessage> {
        const { prompt, intent } = data;

        // Check for OpenAI API key
        if (!openaiApiKey) {
            throw new Error(
                "OPENAI_API_KEY is not configured. TrichBot cannot respond right now."
            );
        }

        // Measure start time
        const started = Date.now();

        // Call OpenAI Responses API (with safer error handling)
        let response;
        try {
            response = await openai.responses.create({
                model: DEFAULT_MODEL,
                input: buildMessages(prompt, intent),
            });
        } catch (err: any) {
            // Avoid leaking the raw key in logs
            console.error("[TrichBot] OpenAI error", {
                status: err?.status,
                code: err?.code,
                message: err?.message,
            });

            // Throw a generic error that the UI can show nicely
            throw new Error("TrichBot AI backend is not available right now.");
        }

        // Extract text and tips
        const text = extractText(response);
        const runtimeSec = (Date.now() - started) / 1000;
        void runtimeSec; // currently unused, but kept for possible logging

        // Simple heuristic: extract "tips" by splitting bullets/lines
        const tips: string[] = text
            .split("\n")
            .map((line) => line.replace(/^[-*•]\s*/, "").trim())
            .filter((line) => line.length > 0)
            .slice(0, 4);

        // Store in MongoDB
        const doc = await TrichBotMessage.create({
            userId,
            prompt,
            response: text,
            tips,
            intent,
            modelInfo: {
                name: DEFAULT_MODEL,
                version: response.id ?? undefined,
            },
            // riskScore left undefined for now, could be integrated with ML later
        });

        return doc;
    },

    // List messages with pagination and sorting
    async listMessages(
        userId: string,
        query: TrichBotListQuery
    ): Promise<ITrichBotMessage[]> {
        const { page, limit, sort } = query;

        // Build sort object
        const sortObj: Record<string, SortOrder> = sort.startsWith("-")
            ? { [sort.slice(1)]: -1 as SortOrder }
            : { [sort]: 1 as SortOrder };

        // No `.lean()` here so the type is ITrichBotMessage[]
        return TrichBotMessage.find({ userId })
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
    },

    // Update feedback on a message
    async updateFeedback(
        id: string,
        feedback: TrichBotFeedbackDTO
    ): Promise<ITrichBotMessage | null> {
        // No `.lean()` so return type matches ITrichBotMessage | null
        return TrichBotMessage.findByIdAndUpdate(
            id,
            { $set: { feedback } },
            { new: true }
        ).exec();
    },
};
