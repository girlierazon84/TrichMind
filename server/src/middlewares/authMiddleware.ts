// server/src/middlewares/authMiddleware.ts

import type {
    Request,
    Response,
    NextFunction,
    RequestHandler
} from "express";
import jwt from "jsonwebtoken";
import { ENV_AUTO } from "../config";


/**----------------------------------------------------------------
 * ✅ Attach auth info to Express Request everywhere (typed).
 * This removes the need for `as any` in routes/controllers.
 * ----------------------------------------------------------------*/
declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string; token?: string };
        }
    }
}

// JWT Payload Type (we rely on `sub` for userId)
type JwtPayload = { sub?: string } & Record<string, unknown>;

// Extract bearer token (Authorization header OR cookie fallback)
function getBearerToken(req: Request): string | undefined {
    // Authorization header
    const hdr = req.headers.authorization;
    // Bearer token
    if (hdr?.startsWith("Bearer ")) return hdr.slice(7);

    // cookie-parser optional support (if cookie-parser is used)
    return (req as any).cookies?.access_token as string | undefined;
}

/**----------------------------------------------
 * Flexible Authentication:
 *   - authentication() → required=true
 *   - authentication(false)
 *   - authentication({ required:false })
 * ---------------------------------------------*/
export function authentication(opts?: boolean | { required?: boolean }): RequestHandler {
    // Determine if authentication is required
    const required =
        typeof opts === "boolean"
            ? opts
            : typeof opts === "object"
                ? opts.required ?? true
                : true;

    // Return middleware
    return (req: Request, res: Response, next: NextFunction) => {
        // Extract token
        const token = getBearerToken(req);

        // No token provided
        if (!token) {
            if (!required) return next();
            return res.status(401).json({
                ok: false,
                error: "Unauthorized",
                message: "No token provided.",
            });
        }

        // Verify token
        const secret = ENV_AUTO.JWT_SECRET ?? process.env.JWT_SECRET;
        if (!secret) {
            // Misconfiguration: not user fault
            return res.status(500).json({
                ok: false,
                error: "ServerMisconfigured",
                message: "JWT secret is not configured on the server.",
            });
        }

        try {
            // Verify & decode token
            const decoded = jwt.verify(token, secret) as JwtPayload;

            // Extract userId from `sub`
            const userId = decoded?.sub?.trim?.();
            // Missing userId in token
            if (!userId) {
                return res.status(401).json({
                    ok: false,
                    error: "Unauthorized",
                    message: "Invalid token payload.",
                });
            }

            // ✅ Attach auth (typed globally as optional)
            req.auth = { userId, token };
            return next();
        } catch (err: any) {
            // Invalid token
            const isExpired = err?.name === "TokenExpiredError";
            return res.status(401).json({
                ok: false,
                error: "Unauthorized",
                message: isExpired ? "Token expired." : "Invalid token.",
            });
        }
    };
}

/**---------------------------------------------------------------------------------
 * ✅ Helper type for controllers (IMPORTANT: auth must be OPTIONAL here)
 *
 * Why optional?
 * Express RequestHandler typing cannot guarantee auth exists,
 * even if your route uses authentication({ required: true }).
 * In controllers, use `req.auth?.userId` or `req.auth!.userId` after a guard.
 * ---------------------------------------------------------------------------------*/
export type AuthRequest = Request & {
    auth?: { userId: string; token?: string };
};

export default authentication;
