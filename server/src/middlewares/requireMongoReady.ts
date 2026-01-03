// server/src/middlewares/requireMongoReady.ts

import type {
    Request,
    Response,
    NextFunction,
    RequestHandler
} from "express";
import mongoose from "mongoose";


/**-------------------------------------------------------------------
    Ensure MongoDB connection is ready before proceeding.
    Returns 503 fast (prevents hangs/timeouts when DB is booting).
----------------------------------------------------------------------*/
export function requireMongoReady(): RequestHandler {
    return (_req: Request, res: Response, next: NextFunction) => {
        const ready = mongoose.connection.readyState === 1; // 1 = connected
        if (ready) return next();

        // MongoDB not ready
        return res.status(503).json({
            ok: false,
            error: "ServiceUnavailable",
            message: "Database is starting up. Please retry in a few seconds.",
            mongoReadyState: mongoose.connection.readyState,
        });
    };
}

export default requireMongoReady;
