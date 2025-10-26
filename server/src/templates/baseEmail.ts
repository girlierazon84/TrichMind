// server/src/templates/baseEmail.ts
export const buildBaseEmail = (title: string, contentHtml: string): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
            body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px;
                    padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { text-align: center; padding-bottom: 20px; }
            .header h1 { color: #21b2ba; margin: 0; font-size: 26px; }
            .content p { color: #444; font-size: 15px; line-height: 1.6; }
            .button { display: inline-block; background-color: #21b2ba;
                color: #fff; text-decoration: none; padding: 12px 24px;
                border-radius: 8px; font-weight: 600; letter-spacing: 0.3px; }
            .footer { text-align: center; color: #888; font-size: 12px; margin-top: 25px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TrichMind Support</h1>
            </div>
            <div class="content">
                ${contentHtml}
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} TrichMind — Helping You Heal 💚</p>
            </div>
        </div>
    </body>
    </html>
`;
