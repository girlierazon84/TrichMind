// server/src/types/express.d.ts

import "@types/express";


// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}
