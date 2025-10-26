import nodemailer from "nodemailer";
import { ENV } from "../config/env";

export const mailer = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: Number(ENV.SMTP_PORT),
    secure: false,
    auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
    },
});

export const sendMail = async (to: string, subject: string, html: string) => {
    await mailer.sendMail({
        from: `"TrichMind Support" <${ENV.SMTP_USER}>`,
        to,
        subject,
        html,
    });
};
