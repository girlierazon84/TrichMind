// server/src/templates/resetPasswordEmail.ts
import { buildBaseEmail } from "./baseEmail";

export const buildResetPasswordEmail = (resetLink: string, displayName?: string) => {
    const name = displayName || "there";

    const contentHtml = `
        <p>Hi ${name},</p>
        <p>We received a request to reset your TrichMind password. Click below to choose a new one:</p>
        <p style="text-align:center;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p>If you didn’t request this, you can safely ignore this message — your account will remain secure.</p>
        <p>This link will expire in <b>15 minutes</b>.</p>
    `;

    const html = buildBaseEmail("Reset Your Password", contentHtml);
    const text = `
        Hi ${name},

        We received a request to reset your TrichMind password.

        Click below to set a new one:
        ${resetLink}

        If you didn’t request this, ignore this email.
        This link will expire in 15 minutes.
    `;

    return { html, text };
};
