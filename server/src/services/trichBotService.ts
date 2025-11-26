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

/**
 * Build messages array for OpenAI chat input
 * We keep the format aligned with the frontend:
 * - One cohesive answer
 * - Validation paragraph
 * - EXACTLY 3 numbered coping ideas (1., 2., 3.)
 * - Optional short Bible verse (max 1) at the end when suitable
 */
function buildMessages(prompt: string, intent?: string) {
    const system = `
You are TrichBot, a friendly but professional, validating assistant for people with trichotillomania.

Guidelines:
- Speak in a calm, hopeful, non-judgmental tone.
- Respond in ONE cohesive answer (do NOT repeat the same sentences).
- First, briefly validate their feelings in 2–3 sentences.
- Then give EXACTLY 3 short, numbered coping ideas using this format:
  1. ...
  2. ...
  3. ...
- Each coping idea should be concrete and actionable and focused on the next small step.
- Avoid medical diagnoses; gently suggest seeking professional support if things feel overwhelming or unsafe.
- When it feels appropriate and not pushy, you may include ONE short, comforting Bible verse at the end (book + chapter:verse + one short line of text), framed as an optional encouragement, never as blame or pressure.
- Do not include more than one verse.
- Aim for around 120–180 words total.
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

/**
 * Extracts numbered coping tips from the full response text.
 * This is kept in sync with the frontend, which also looks for `1.`, `2.`, `3.`.
 */
function extractTips(text: string): string[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\d+\.\s+/.test(line))
        .map((line) => line.replace(/^\d+\.\s+/, ""))
        .slice(0, 3); // exactly up to 3 tips
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

        // Measure start time (kept for potential logging)
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

        const text = extractText(response);
        const runtimeSec = (Date.now() - started) / 1000;
        void runtimeSec; // currently unused, but kept for possible logging

        // Extract tips based on numbered lines (1., 2., 3.)
        const tips: string[] = extractTips(text);

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

export default botService;
