// server/src/types/express.d.ts

import "express";


// Extend Express Request to include auth property
declare module "express" {
    interface Request {
        auth?: {
            userId: string;
        };
    }
}
