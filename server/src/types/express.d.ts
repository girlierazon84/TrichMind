// server/src/types/express.d.ts
// Augment Express Request with `auth` but DO NOT override the whole module.

import type { Request } from "express";

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

export {};
