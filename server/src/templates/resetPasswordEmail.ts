// server/src/templates/resetPasswordEmail.ts
export const buildResetPasswordEmail = (resetLink: string, displayName?: string) => {
    const userName = displayName || "there";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Reset Your TrichMind Password</title>
        <style>
            body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px;
                padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; padding-bottom: 20px; }
            .header h1 { color: #21b2ba; margin: 0; }
            .content p { color: #444; font-size: 15px; line-height: 1.6; }
            .button { display: block; margin: 25px auto; width: fit-content; background-color: #21b2ba;
                color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px;
                font-weight: 600; letter-spacing: 0.3px; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 25px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TrichMind Support</h1>
            </div>
            <div class="content">
                <p>Hi ${userName},</p>
                <p>We received a request to reset your TrichMind password. Click below to choose a new one:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p>If you didn’t request this, you can safely ignore this message — your account will remain secure.</p>
                <p>This link will expire in <b>15 minutes</b>.</p>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} TrichMind — Helping You Heal</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const text = `
        Hi ${userName},

        We received a request to reset your TrichMind password.

        Click the link below to set a new password:
        ${resetLink}

        If you didn’t request this, you can ignore this email.
        The link will expire in 15 minutes.

        — The TrichMind Team
    `;

    return { html, text };
};
