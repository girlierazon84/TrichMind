// server/src/utils/mailer.ts
import nodemailer from "nodemailer";
import { ENV } from "../config/env";
import { logger } from "./logger";

const smtpPort = Number(ENV.SMTP_PORT) || 587;

export const mailer = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // use TLS for port 465
    auth: ENV.SMTP_USER
        ? {
            user: ENV.SMTP_USER,
            pass: ENV.SMTP_PASS,
        }
        : undefined,
});

/**
 * Send an email with HTML + text fallback
 */
export const sendMail = async (to: string, subject: string, html: string, text?: string) => {
    try {
        if (!to) throw new Error("Missing recipient address");

        await mailer.sendMail({
            from: `"TrichMind Support" <${ENV.SMTP_USER || "no-reply@trichmind.app"}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, ""), // strip HTML if no plain text
        });

        logger.info(`📧 Email sent: "${subject}" → ${to}`);
    } catch (err: any) {
        logger.error(`❌ Email send failed (${subject} → ${to}): ${err.message}`);
    }
};
