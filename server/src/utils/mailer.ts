// server/src/utils/mailer.ts

import nodemailer from "nodemailer";
import { ENV } from "../config";
import { logger } from "./logger";


/**------------
    Helpers
---------------*/
// Simple HTML stripper for generating text version of email
const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// Resolve the "from" address for outgoing emails
const resolveFromAddress = () => {
    // Prefer SMTP_USER when present (most SMTP providers require this)
    // Fallback to a no-reply address for dev/test.
    const email = ENV.SMTP_USER?.trim() || "no-reply@trichmind.app";
    return `"TrichMind Support" <${email}>`;
};

// Check if SMTP is properly configured
const isEmailConfigured = () => {
    // If SMTP_USER is empty, we treat mail as "disabled" (safe for Render/dev)
    return Boolean(ENV.SMTP_USER?.trim()) && Boolean(ENV.SMTP_PASS?.trim());
};

// Parse SMTP port, default to 587 if invalid
const smtpPort = Number(ENV.SMTP_PORT) || 587;

/**---------------
    Transport
------------------*/
export const mailer = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // TLS for 465
    auth: isEmailConfigured()
        ? {
            user: ENV.SMTP_USER,
            pass: ENV.SMTP_PASS,
        }
        : undefined,
});

/**----------------------------------------------------------
    Optional: verify connection on startup (non-blocking)
-------------------------------------------------------------*/
export const verifyMailer = async () => {
    if (!isEmailConfigured()) {
        logger.warn("📭 SMTP not configured (SMTP_USER/SMTP_PASS missing) — email sending disabled.");
        return { ok: false, reason: "smtp_not_configured" as const };
    }

    // Verify connection
    try {
        await mailer.verify();
        logger.info("✅ SMTP transporter verified");
        return { ok: true as const };
    } catch (err) {
        logger.error("❌ SMTP transporter verify failed", {
            error: (err as Error)?.message ?? String(err),
        });
        return { ok: false, reason: "smtp_verify_failed" as const };
    }
};

/**---------------
    Send email
------------------*/
export type SendMailArgs = {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    //If true (default), missing SMTP config will *not* throw,
    // it will just log a warning and return ok=false.
    softFail?: boolean;
};

// Send an email
export const sendMail = async ({
    to,
    subject,
    html,
    text,
    replyTo,
    softFail = true,
}: SendMailArgs) => {
    // Validate inputs
    try {
        if (!to?.trim()) throw new Error("Missing recipient address");
        if (!subject?.trim()) throw new Error("Missing email subject");
        if (!html?.trim()) throw new Error("Missing email html");

        // Check SMTP config
        if (!isEmailConfigured()) {
            const msg = "SMTP not configured (SMTP_USER/SMTP_PASS missing) — skipping sendMail";
            if (softFail) {
                logger.warn(`📭 ${msg}`, { to, subject });
                return { ok: false as const, skipped: true as const, reason: "smtp_not_configured" as const };
            }
            throw new Error(msg);
        }

        // Send email
        await mailer.sendMail({
            from: resolveFromAddress(),
            to,
            subject,
            html,
            text: text?.trim() ? text : stripHtml(html),
            ...(replyTo?.trim() ? { replyTo: replyTo.trim() } : {}),
        });

        // Log success
        logger.info("📧 Email sent", { to, subject });
        return { ok: true as const };
    } catch (err) {
        logger.error("❌ Email send failed", {
            to,
            subject,
            error: (err as Error)?.message ?? String(err),
        });
        return { ok: false as const, error: (err as Error)?.message ?? String(err) };
    }
};

export default { mailer, sendMail, verifyMailer };
