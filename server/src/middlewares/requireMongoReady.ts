// server/src/middlewares/requireMongoReady.ts

import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";


/**------------------------------------------------------------------------
    Middleware to ensure MongoDB connection is ready before proceeding.
    Returns 503 fast (prevents 30s hangs / timeouts in clients).
---------------------------------------------------------------------------*/
export function requireMongoReady() {
    return (_req: Request, res: Response, next: NextFunction) => {
        const ready = mongoose.connection.readyState === 1; // 1 = connected
        if (ready) return next();

        return res.status(503).json({
            ok: false,
            error: "ServiceUnavailable",
            message: "Database is starting up. Please retry in a few seconds.",
            mongoReadyState: mongoose.connection.readyState,
        });
    };
}
