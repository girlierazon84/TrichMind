import nodemailer from "nodemailer";
import { ENV } from "../config/env";
import { logger } from "./logger";

export const mailer = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: Number(ENV.SMTP_PORT),
    secure: false,
    auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
    },
});

/**
 * Send an email with HTML + text
 */
export const sendMail = async (
    to: string,
    subject: string,
    html: string,
    text?: string
) => {
    try {
        await mailer.sendMail({
            from: `"TrichMind Support" <${ENV.SMTP_USER}>`,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]+>/g, ""), // fallback plain text
        });

        logger.info(`📧 Email sent: ${subject} → ${to}`);
    } catch (err: any) {
        logger.error(`❌ Email send failed (${subject} → ${to}): ${err.message}`);
    }
};
