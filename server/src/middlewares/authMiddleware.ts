// server/src/middlewares/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";

declare global {
    namespace Express {
        interface Request {
            auth?: { userId: string; token?: string };
        }
    }
}

type Decoded = { sub?: string } & Record<string, unknown>;

function getBearerToken(req: Request): string | undefined {
    const hdr = req.headers.authorization;
    if (hdr?.startsWith("Bearer ")) return hdr.slice(7);
    return (req as any).cookies?.token;
}

/**
 * Middleware: Authenticate request via JWT in Authorization header.
 * @param opts.required - If false, lets requests without tokens pass (guest mode)
 */
export function authentication(opts: { required?: boolean } = { required: true }) {
    const { required = true } = opts;
    return (req: Request, res: Response, next: NextFunction) => {
        const token = getBearerToken(req);
        if (!token)
            return required
                ? res.status(401).json({ error: "Unauthorized" })
                : next();

        try {
            const decoded = jwt.verify(token, ENV.JWT_SECRET) as Decoded;
            const userId = (decoded.sub as string) || "";
            if (!userId)
                return required
                    ? res.status(401).json({ error: "Unauthorized" })
                    : next();

            req.auth = { userId, token };
            next();
        } catch (err) {
            console.warn("[auth] Invalid token:", err);
            return required
                ? res.status(401).json({ error: "Invalid token" })
                : next();
        }
    };
}

export type AuthRequest = Request & { auth: { userId: string; token?: string } };
