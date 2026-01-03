// server/src/templates/welcomeEmail.ts

import { buildBaseEmail } from "./baseEmail";

type WelcomeEmailArgs = {
    displayName?: string;
    loginUrl: string; // should come from ENV.CLIENT_URL + "/login"
};

export const buildWelcomeEmail = ({ displayName, loginUrl }: WelcomeEmailArgs) => {
    const name = displayName?.trim() || "there";

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>Welcome to <b>TrichMind</b> — we’re glad you’re here.</p>
        <p>
            TrichMind is designed to help you understand patterns, manage triggers,
            and build supportive strategies that work for <i>you</i>.
        </p>
        <p class="muted">Tip: a small daily check-in can make patterns easier to spot over time.</p>
    `;

    const html = buildBaseEmail({
        title: "Welcome to TrichMind!",
        preheader: "Your account is ready — start your first check-in.",
        contentHtml,
        buttonText: "Get Started",
        buttonUrl: loginUrl,
    });

    const text = [
        `Hi ${name},`,
        "",
        "Welcome to TrichMind — we’re glad you joined!",
        "",
        `Log in here: ${loginUrl}`,
        "",
        "If you ever need help, reply to this email — we’re here for you.",
        "",
        "— The TrichMind Team",
    ].  join("\n");
    return { html, text };
};
