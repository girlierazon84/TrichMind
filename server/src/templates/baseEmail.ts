// server/src/templates/baseEmail.ts

type BaseEmailOptions = {
    title: string;
    preheader?: string;
    contentHtml: string;
    /** Optional CTA */
    buttonText?: string;
    buttonUrl?: string;
    /** Brand / app links (should come from ENV.CLIENT_URL in caller if desired) */
    brandName?: string;
    supportName?: string;
};

const escapeHtml = (s: string) =>
    s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

export const buildBaseEmail = (opts: BaseEmailOptions): string => {
    const brandName = opts.brandName ?? "TrichMind";
    const supportName = opts.supportName ?? "TrichMind Support";
    const year = new Date().getFullYear();

    // Hidden preview line shown in inbox clients
    const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";

    const cta =
        opts.buttonText && opts.buttonUrl
            ? `
                <div class="cta">
                    <a href="${opts.buttonUrl}" class="button" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(opts.buttonText)}
                    </a>
                </div>
            `
        :   "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${escapeHtml(opts.title)}</title>
    <style>
        /* Email-safe styles (avoid relying on modern CSS only) */
        body { margin:0; padding:0; background:#f8fafc; font-family:Segoe UI, Roboto, Arial, sans-serif; }
        table { border-collapse:collapse; }
        .wrap { width:100%; background:#f8fafc; padding:24px 0; }
        .container { width:600px; max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.05); }
        .header { padding:22px 24px; text-align:center; background:#ffffff; border-bottom:1px solid #eef2f7; }
        .header h1 { margin:0; font-size:22px; color:#21b2ba; }
        .content { padding:22px 24px; }
        .content p { margin:0 0 12px 0; color:#334155; font-size:15px; line-height:1.6; }
        .content ul { margin:10px 0 14px 18px; padding:0; color:#334155; font-size:15px; line-height:1.6; }
        .content li { margin:6px 0; }
        .cta { text-align:center; margin:18px 0 6px; }
        .button { display:inline-block; background:#21b2ba; color:#ffffff !important; text-decoration:none; padding:12px 22px; border-radius:10px; font-weight:600; letter-spacing:0.2px; }
        .muted { color:#64748b; font-size:12px; line-height:1.6; }
        .footer { padding:16px 24px; text-align:center; background:#ffffff; border-top:1px solid #eef2f7; }
        .footer p { margin:0; color:#94a3b8; font-size:12px; }
        /* Mobile */
        @media only screen and (max-width: 620px) {
            .container { width:100% !important; border-radius:0 !important; }
            .content, .header, .footer { padding-left:16px !important; padding-right:16px !important; }
        }
    </style>
</head>
<body>
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
        ${preheader}
    </div>

    <table class="wrap" role="presentation" width="100%">
        <tr>
            <td align="center">
                <table class="container" role="presentation" width="600">
                    <tr>
                        <td class="header">
                            <h1>${escapeHtml(supportName)}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            ${opts.contentHtml}
                            ${cta}
                            <p class="muted" style="margin-top:14px;">
                                If you have any questions, just reply to this email — we’re here for you.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>© ${year} ${escapeHtml(brandName)} — Helping You Heal 💚</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};
