// test-openai.ts
import OpenAI from "openai";

function requireEnv(key: string): string {
    const v = process.env[key]?.trim();
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
}

async function main() {
    // ✅ ensure env is loaded (dotenv supports both .env and .env.local)
    // If you run this from /server root, it will pick up your .env.local
    const { default: dotenv } = await import("dotenv");
    const { default: path } = await import("path");

    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
    dotenv.config({ path: path.resolve(process.cwd(), ".env") });

    const apiKey = requireEnv("OPENAI_API_KEY");
    const client = new OpenAI({ apiKey });

    // ✅ quick sanity check call
    const resp = await client.models.list();
    console.log("✅ OpenAI OK — models count:", resp.data.length);

    // Optional: show first few model ids
    console.log(
        "First models:",
        resp.data
            .map((m) => m.id)
            .filter(Boolean)
            .slice(0, 10)
    );
}

main().catch((err) => {
    const msg = (err as Error)?.message ?? String(err);
    console.error("❌ OpenAI test error:", msg);
    process.exitCode = 1;
});
