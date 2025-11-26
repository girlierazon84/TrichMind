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

// ✅ Use a real, supported default model
// You can override this in .env with OPENAI_MODEL=gpt-4.1-mini or OPENAI_MODEL=gpt-5
const DEFAULT_MODEL = ENV_OPENAI.OPENAI_MODEL || "gpt-4.1-mini";

// Initialise OpenAI client (we guard missing key in createMessage)
const openai = new OpenAI({
    apiKey: openaiApiKey || "dummy", // will error at runtime if truly missing
});

/**
 * Simple heuristic: is this message just a greeting / intro?
 * Example: "hi", "hello", "hey", "who are you?", "what do you do?"
 */
function isGreetingMessage(prompt: string): boolean {
    const trimmed = prompt.trim();
    const lower = trimmed.toLowerCase();

    const shortGreeting =
        trimmed.length <= 20 &&
        /^(hi|hello|hey|hej|hola|hallo|hei)[!.? ]*$/i.test(lower);

    const introQuestion =
        /who are you|what do you do|what are you/i.test(lower);

    return shortGreeting || introQuestion;
}

/**
 * Build messages array for OpenAI chat input.
 *
 * Behaviour rules:
 * - If the user clearly talks about urges / distress / difficulties:
 *    • Validate feelings (2–3 sentences).
 *    • Then give up to 3 numbered coping ideas (1., 2., 3.).
 *    • Optionally add ONE short comforting Bible verse at the end,
 *      wrapped in <verse>...</verse> so the backend can emphasise it.
 *
 * - If the user only greets or asks who you are (e.g. “hi”, “hello”, “who are you?”):
 *    • Respond briefly and naturally (2–4 sentences).
 *    • Introduce TrichBot and invite them to share what they’re going through.
 *    • Do NOT include numbered coping ideas or Bible verses in that case.
 */
function buildMessages(prompt: string, intent?: string) {
    const greeting = isGreetingMessage(prompt);

    const distressSystem = `
You are TrichBot, a friendly but professional, validating assistant for people with trichotillomania.

Tone & style:
- Speak in a calm, hopeful, non-judgmental tone.
- Sound warm, authentic, and grounded – not scripted or robotic.
- Respond in ONE cohesive answer (do NOT repeat the same sentences).

When the user shares urges, distress, or difficulties:
- First, briefly validate their feelings in 2–3 sentences.
- Then give up to 3 short, numbered coping ideas using this exact format:
    1. ...
    2. ...
    3. ...
- Each coping idea must be concrete, realistic, and focused on the next small step.
- Avoid medical diagnoses; gently suggest seeking professional or crisis support if things feel overwhelming or unsafe.
- When it feels appropriate and not pushy, you may include ONE short, comforting Bible verse at the very end:
    • Wrap the entire verse in <verse> and </verse> tags like this (without extra text around it):
        <verse>Psalm 34:18 – "The Lord is close to the brokenhearted and saves those who are crushed in spirit."</verse>
    • Do NOT add your own Markdown like ** or _ around the verse.
    • Include the book + chapter:verse + one short line of text.
    • Frame it as optional encouragement, never as blame or pressure.
    • Do not include more than one verse.
- Aim for around 120–180 words in total.
`.trim();

    const greetingSystem = `
You are TrichBot, a friendly but professional, validating assistant for people with trichotillomania.

For simple greetings or intro questions (for example: "hi", "hello", "who are you?", "what do you do?"):
- Reply briefly in about 2–4 sentences.
- Greet the user and introduce yourself as TrichBot.
- Explain in simple language how you can support them with urges, feelings, and coping ideas.
- Invite them to share more when they feel ready.
- Do NOT include numbered coping ideas in this case.
- Do NOT include any Bible verse in this case.
- Keep the tone light, welcoming, and reassuring.
`.trim();

    // Choose system message based on whether this looks like a greeting
    let system = greeting ? greetingSystem : distressSystem;

    // Only add intent hint when it's not a pure greeting
    if (intent && !greeting) {
        system += `\n\nUser intent hint: ${intent}`;
    }

    return [
        { role: "system" as const, content: system },
        { role: "user" as const, content: prompt },
    ];
}

// Extract text response from OpenAI response object
function extractText(resp: any): string {
    // For OpenAI Responses API (GPT-4.1 / GPT-5 family):
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
 * Post-process text to emphasise any verse:
 * 1) If wrapped in <verse>...</verse>, convert to <strong><em>...</em></strong>.
 * 2) If the model still returns **_..._**, convert that to <strong><em>...</em></strong>.
 */
function emphasiseBibleVerse(text: string): string {
    let output = text;

    // Handle <verse>...</verse> tags first
    output = output.replace(
        /<verse>\s*([\s\S]*?)\s*<\/verse>/i,
        "<strong><em>$1</em></strong>"
    );

    // Also handle any existing markdown-style **_..._**
    output = output.replace(
        /\*\*_(.+?)_\*\*/g,
        "<strong><em>$1</em></strong>"
    );

    return output;
}

/**
 * Extracts numbered coping tips from the full response text.
 *
 * - Looks for lines starting with "1. ", "2. ", etc.
 * - Returns up to 3 tips.
 * - For simple greetings (no numbered lines), this will return an empty array,
 *   which is fine – the frontend will then just show the intro text only.
 */
function extractTips(text: string): string[] {
    return text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^\d+\.\s+/.test(line))
        .map((line) => line.replace(/^\d+\.\s+/, ""))
        .slice(0, 3);
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

        // Raw text from OpenAI
        const rawText = extractText(response);
        const runtimeSec = (Date.now() - started) / 1000;
        void runtimeSec; // placeholder for future logging

        // Emphasise any verse (convert to <strong><em>...</em></strong>)
        const text = emphasiseBibleVerse(rawText);

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
