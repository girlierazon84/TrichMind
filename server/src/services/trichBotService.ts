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
    TRICHBOT_ENABLED?: string;
};

// OpenAI configuration
const openaiApiKey =
    ENV_OPENAI.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

// ✅ Use a real, supported default model
// You can override this in .env with OPENAI_MODEL=gpt-4.1-mini or OPENAI_MODEL=gpt-5
const DEFAULT_MODEL = ENV_OPENAI.OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";

// ✅ Feature flag: TrichBot can be turned off in demo / cheap mode
const TRICHBOT_ENABLED =
    (ENV_OPENAI.TRICHBOT_ENABLED ?? process.env.TRICHBOT_ENABLED ?? "false")
        .toLowerCase() === "true";

// Initialise OpenAI client (we guard missing key in createMessage)
const openai = new OpenAI({
    apiKey: openaiApiKey || "dummy", // will error at runtime if truly missing
});

/**-------------------------------------------------------------------------------------------
    Simple heuristic: is this message just a greeting / intro?
    Example: "hi", "hello", "hey", "who are you?", "what do you do?", "what is trichmind?"
----------------------------------------------------------------------------------------------*/
function isGreetingMessage(prompt: string): boolean {
    const trimmed = prompt.trim();
    const lower = trimmed.toLowerCase();

    const shortGreeting =
        trimmed.length <= 40 &&
        /^(hi|hello|hey|hej|hola|hallo|hei)[!.? ]*$/i.test(lower);

    const introQuestion =
        /who are you|what do you do|what are you|what is this app|what is trichmind|what is trichbot/i.test(
            lower
        );

    return shortGreeting || introQuestion;
}

/**-----------------------------------------------------------------------------------------
    Build messages array for OpenAI chat input.
--------------------------------------------------------------------------------------------*/
function buildMessages(prompt: string, intent?: string) {
    const greeting = isGreetingMessage(prompt);

    const distressSystem = `
You are TrichBot, the in-app assistant inside the TrichMind app. TrichMind is a supportive digital companion for people living with trichotillomania.

TrichMind context (features you can mention):
- A relapse risk dashboard that shows how their risk is trending over time.
- Daily check-ins / urge tracking cards where they can log urges, emotions, and small wins.
- A coping strategies card/library where they can save what has worked or not worked.
- Notes / journaling space to process thoughts, triggers, and patterns.
- A relapse overview / history view that shows ups and downs over time.
- This TrichBot chat, where they can talk through urges, stress, and questions.
- Gentle reminders about self-compassion and small steps forward.
- Mini-games for urge management.
- HYGA Essentials calming kits and tools.

When responding to users:
- Always prioritise validating their feelings in a warm, non-judgmental way.
- Offer up to 3 concrete, realistic coping ideas in numbered format (1., 2., 3.).
- Suggest relevant TrichMind features when appropriate, but do NOT invent their personal data.

IMPORTANT:
- You do NOT see real-time data from their dashboard. Talk in general terms like “your TrichMind dashboard” or “your daily check-in” without inventing specific scores or entries.
- Never say “I can see your risk score is X” or pretend you see private data.

Tone & style:
- Speak in a calm, hopeful, non-judgmental tone.
- Sound warm, authentic, and grounded – not scripted or robotic.
- Respond in ONE cohesive answer (do NOT repeat the same sentences).

When the user shares urges, distress, or difficulties:
- First, briefly validate their feelings in 2–3 sentences.
- When relevant, mention how TrichMind tools might help (for example:
    “You could log this urge in your TrichMind daily check-in and note what triggered it,”
    or “On your TrichMind dashboard, you can look back at days that felt a bit safer.”).
- Then give up to 3 short, numbered coping ideas using this exact format:
    1. ...
    2. ...
    3. ...
- Each coping idea must be concrete, realistic, and focused on the next small step.
- You may include gentle suggestions like:
    • using breathing or grounding exercises,
    • changing environment or posture,
    • using hands in a different way,
    • writing down thoughts in their TrichMind notes/journal,
    • reviewing what worked for them in their coping strategies list.
- Avoid medical diagnoses; gently suggest seeking professional or crisis support if things feel overwhelming or unsafe.

When it feels appropriate and not pushy, you may include ONE short, comforting Bible verse at the very end:
    • Wrap the entire verse in <verse> and </verse> tags like this (without extra text around it):
        <verse>Psalm 34:18 – "The Lord is close to the brokenhearted and saves those who are crushed in spirit."</verse>
    • Do NOT add your own Markdown like ** or _ around the verse.
    • Include the book + chapter:verse + one short line of text.
    • Frame it as optional encouragement, never as blame or pressure.
    • Do not include more than one verse.

Aim for around 120–180 words in total.
    - Aim for 3 concise paragraphs + the numbered tips.
    - Avoid repeating the same validation sentence in different words.
`.trim();

    const greetingSystem = `
You are TrichBot, the in-app assistant inside the TrichMind app. TrichMind is designed to gently support people with trichotillomania.

For simple greetings or intro questions (for example: "hi", "hello", "who are you?", "what do you do?", "what is TrichMind?"):
- Reply briefly in about 2–4 sentences.
- Greet the user and introduce yourself as TrichBot, the assistant within the TrichMind app.
- Explain in simple language how you can support them with urges, feelings, and coping ideas.
- Briefly mention a few TrichMind features, such as:
    • the relapse risk dashboard,
    • daily urge / mood check-ins,
    • coping strategies cards,
    • notes or journaling,
    • this TrichBot chat.
- Make it clear you cannot see their data directly, but you can suggest how they might use these tools.
- Invite them to share more when they feel ready.
- Do NOT include numbered coping ideas in this case.
- Do NOT include any Bible verse in this case.
- Keep the tone light, welcoming, and reassuring.
`.trim();

    let system = greeting ? greetingSystem : distressSystem;

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
    const first = resp.output?.[0];
    if (first && "content" in first) {
        const textPart = first.content?.find((p: any) => p.type === "output_text");
        if (textPart?.text) return textPart.text;
    }

    const choice = resp.choices?.[0];
    return (
        choice?.message?.content ||
        resp.output_text?.[0]?.content?.[0]?.text ||
        "I'm here for you. 💚"
    );
}

function emphasiseBibleVerse(text: string): string {
    let output = text;

    output = output.replace(
        /<verse>\s*([\s\S]*?)\s*<\/verse>/i,
        "<strong><em>$1</em></strong>"
    );

    output = output.replace(/\*\*_(.+?)_\*\*/g, "<strong><em>$1</em></strong>");

    return output;
}

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
    async createMessage(
        userId: string,
        data: TrichBotCreateDTO
    ): Promise<ITrichBotMessage> {
        const { prompt, intent } = data;

        // 🌿 DEMO / OFFLINE MODE: no OpenAI cost, but UI still works
        if (!TRICHBOT_ENABLED) {
            const doc = await TrichBotMessage.create({
                userId,
                prompt,
                response:
                    "TrichBot is currently turned off in this demo environment, but the rest of TrichMind still works 🌿",
                tips: [],
                intent,
                modelInfo: {
                    name: "disabled",
                    version: "offline",
                },
            });
            return doc;
        }

        // If bot is enabled, we *require* a key
        if (!openaiApiKey) {
            throw new Error(
                "OPENAI_API_KEY is not configured. TrichBot cannot respond right now."
            );
        }

        const started = Date.now();

        let response;
        try {
            response = await openai.responses.create({
                model: DEFAULT_MODEL,
                input: buildMessages(prompt, intent),
            });
        } catch (err: any) {
            console.error("[TrichBot] OpenAI error", {
                status: err?.status,
                code: err?.code,
                message: err?.message,
            });
            throw new Error("TrichBot AI backend is not available right now.");
        }

        const rawText = extractText(response);
        const runtimeSec = (Date.now() - started) / 1000;
        void runtimeSec;

        const text = emphasiseBibleVerse(rawText);
        const tips: string[] = extractTips(text);

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
            // riskScore can be added later from ML
        });

        return doc;
    },

    async listMessages(
        userId: string,
        query: TrichBotListQuery
    ): Promise<ITrichBotMessage[]> {
        const { page, limit, sort } = query;

        const sortObj: Record<string, SortOrder> = sort.startsWith("-")
            ? { [sort.slice(1)]: -1 as SortOrder }
            : { [sort]: 1 as SortOrder };

        return TrichBotMessage.find({ userId })
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();
    },

    async updateFeedback(
        id: string,
        feedback: TrichBotFeedbackDTO
    ): Promise<ITrichBotMessage | null> {
        return TrichBotMessage.findByIdAndUpdate(
            id,
            { $set: { feedback } },
            { new: true }
        ).exec();
    },

    async clearMessages(userId: string): Promise<number> {
        const result = await TrichBotMessage.deleteMany({ userId }).exec();
        return result.deletedCount ?? 0;
    },
};

export default botService;
