// server/src/middlewares/authMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config";


// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                token?: string;
            };
        }
    }
}

// JWT Payload Type
type JwtPayload = { sub?: string } & Record<string, unknown>;

/** Extract bearer token */
function getBearerToken(req: Request): string | undefined {
    const hdr = req.headers.authorization;
    if (hdr?.startsWith("Bearer ")) return hdr.substring(7);
    return (req as any).cookies?.access_token;
}

/**
 * Flexible Authentication:
 * - authentication() → required=true
 * - authentication(false)
 * - authentication({ required:false })
 */
export function authentication(
    opts?: boolean | { required?: boolean }
) {
    const required =
        typeof opts === "boolean"
            ? opts
            : typeof opts === "object"
                ? opts.required ?? true
                : true;

    return (req: Request, res: Response, next: NextFunction) => {
        const token = getBearerToken(req);

        if (!token) {
            return required
                ? res.status(401).json({ error: "No token provided" })
                : next();
        }

        try {
            const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
            const userId = decoded.sub;

            if (!userId) {
                return res.status(401).json({ error: "Invalid token" });
            }

            req.auth = { userId, token };
            return next();
        } catch (err: any) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ error: "Token expired" });
            }
            return res.status(401).json({ error: "Invalid token" });
        }
    };
}

// Extended Request Type
export type AuthRequest = Request & {
    auth: { userId: string; token?: string };
};

export default authentication;
