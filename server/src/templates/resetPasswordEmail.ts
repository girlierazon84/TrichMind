// server/src/templates/resetPasswordEmail.ts

import { buildBaseEmail } from "./baseEmail";

type ResetPasswordEmailArgs = {
    resetLink: string;
    displayName?: string;
};

export const buildResetPasswordEmail = ({
    resetLink,
    displayName,
}:  ResetPasswordEmailArgs) => {
        const name = displayName?.trim() || "there";

        const contentHtml = `
            <p>Hi ${name},</p>
            <p>We received a request to reset your TrichMind password.</p>
            <p class="muted">For your security, this link will expire in <b>15 minutes</b>.</p>
        `;

    const html = buildBaseEmail({
        title: "Reset your TrichMind password",
        preheader: "Reset your password (link expires in 15 minutes).",
        contentHtml,
        buttonText: "Reset Password",
        buttonUrl: resetLink,
    });

    const text = [
        `Hi ${name},`,
        "",
        "We received a request to reset your TrichMind password.",
        "",
        `Reset link (expires in 15 minutes): ${resetLink}`,
        "",
        "If you didn’t request this, you can safely ignore this email.",
        "",
        "— The TrichMind Team",
    ].join("\n");

    return { html, text };
};
