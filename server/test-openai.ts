// test-openai.ts
import OpenAI from "openai";

async function main() {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const resp = await client.models.list();
    console.log("Models OK, count:", resp.data.length);
}

main().catch((err) => {
    console.error("OpenAI test error:", err);
});
