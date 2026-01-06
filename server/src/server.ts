// server/src/server.ts

import express, {
    type Request,
    type Response,
    type NextFunction
} from "express";
import cors, { type CorsOptions } from "cors";
import mongoose from "mongoose";

import { connectMongo, ENV_AUTO } from "./config";
import {
    notFound,
    errorHandler,
    requireMongoReady
} from "./middlewares";
import {
    logger,
    startWeeklySummaryScheduler,
    verifyMailer
} from "./utils";


/**------------------
    Route Imports
---------------------*/
import authRoutes from "./routes/authRoutes";
import alertRoutes from "./routes/alertRoutes";
import summaryRoutes from "./routes/summaryRoutes";
import predictRoutes from "./routes/predictRoutes";
import userRoutes from "./routes/userRoutes";
import healthRoutes from "./routes/healthRoutes";
import journalRoutes from "./routes/journalRoutes";
import triggersInsightsRoutes from "./routes/triggersInsightsRoutes";
import trichBotRoutes from "./routes/trichBotRoutes";
import trichGameRoutes from "./routes/gameRoutes";
import loggerRoutes from "./routes/loggerRoutes";
import relapseOverviewRoutes from "./routes/relapseOverviewRoutes";
import dailyProgressRoutes from "./routes/dailyProgressRoutes";


/**---------------------------
    Initialize Express App
------------------------------*/
const app = express();

/**---------------------------------------------------------------------
    ✅ IMPORTANT: disable mongoose command buffering IMMEDIATELY.
    If buffering is enabled, requests can hang while Mongo connects.
------------------------------------------------------------------------*/
mongoose.set("bufferCommands", false);

/**-----------------------------------------
    🔍 Simple request logger (dev only)
--------------------------------------------*/
if (ENV_AUTO.NODE_ENV !== "production") {
    // App-wide request logger
    app.use((req: Request, _res: Response, next: NextFunction) => {
        // eslint-disable-next-line no-console
        console.log(`➡️  ${req.method} ${req.originalUrl}`);
        next();
    });
}

/**----------------------------------------
    ✅ CORS – multi-origin, env-driven
-------------------------------------------*/

// CORS origins from ENV_AUTO (array)
const envCorsOrigins: string[] = Array.isArray(ENV_AUTO.CORS_ORIGINS)
    ? ENV_AUTO.CORS_ORIGINS
    : [];

// Fallback CORS origins (comma-separated string)
const fallbackRaw =
    process.env.CORS_ORIGIN ||
    `${ENV_AUTO.CLIENT_URL},http://localhost:5050,http://localhost:5173`;

// Parse fallback origins
const fallbackOrigins = fallbackRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

// Combine and deduplicate allowed origins
const ALLOWED_ORIGINS: string[] = Array.from(
    new Set(envCorsOrigins.length > 0 ? envCorsOrigins : fallbackOrigins)
);

// Log allowed origins in non-production
if (ENV_AUTO.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log("🌐 [CORS] Allowed origins:", ALLOWED_ORIGINS);
}

// CORS options
const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (!origin) return callback(null, true);

        const allowed =
            ALLOWED_ORIGINS.includes(origin) ||
            origin.endsWith(".vercel.app") ||
            origin.endsWith(".netlify.app");

        if (allowed) return callback(null, true);

        // Explicit rejection (clearer than callback(null, false))
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

/**-------------------------------------------------------------------------
    ✅ Explicit preflight handler
    Use regex instead of "*" to avoid path-to-regexp crash on Express 5.
----------------------------------------------------------------------------*/
app.options(/.*/, cors(corsOptions));

/**----------------------------------------
    ✅ Body parsers (JSON, urlencoded)
-------------------------------------------*/
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/**-------------------------
    🧪 Health endpoints
----------------------------*/

// Simple ping endpoint
app.get("/api/ping", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "pong" });
});

// Mongo readiness endpoint
app.get("/api/ready", (_req: Request, res: Response) => {
    // Mongo readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
        ok: ready,
        mongoReadyState: mongoose.connection.readyState,
    });
});

/**------------------------------------------
    ✅ DB Guard (prevents request hangs)
---------------------------------------------*/
const requireMongo = requireMongoReady();

/**-------------------
    ✅ API Routes
----------------------*/
// Mongo-backed routes (guarded)
app.use("/api/alerts", requireMongo, alertRoutes);
app.use("/api/auth", requireMongo, authRoutes);
app.use("/api/health", requireMongo, healthRoutes);
app.use("/api/journal", requireMongo, journalRoutes);
app.use("/api/logs", requireMongo, loggerRoutes);
app.use("/api/summary", requireMongo, summaryRoutes);
app.use("/api/trichbot", requireMongo, trichBotRoutes);
app.use("/api/games", requireMongo, trichGameRoutes);
app.use("/api/triggers", requireMongo, triggersInsightsRoutes);
app.use("/api/users", requireMongo, userRoutes);
app.use("/api/overview", requireMongo, relapseOverviewRoutes);
app.use("/api/daily-progress", requireMongo, dailyProgressRoutes);

// ✅ If /api/ml uses Mongo, keep guarded; if it calls an external ML service only, remove requireMongo.
app.use("/api/ml", requireMongo, predictRoutes);

/**-----------------------------
    ✅ 404 + Error Handlers
--------------------------------*/
app.use(notFound);
app.use(errorHandler);

/**------------------------------------------
    🕒 Scheduler (Weekly Summary Emails)
---------------------------------------------*/
// NOTE: keep scheduler registration here, but it should soft-fail if SMTP isn't configured.
startWeeklySummaryScheduler();

/**---------------------
    🚀 Start Server
------------------------*/
const port = ENV_AUTO.PORT || 8080;

/**---------------------------------------------------------------------------------
    ✅ Always start HTTP server first (prevents Render/hosting 502 during boot)
    ✅ Connect Mongo + verify SMTP in background
------------------------------------------------------------------------------------*/
app.listen(port, () => {
    // Log server start
    logger.info(`🚀 TrichMind Server running on port ${port}`);
    // eslint-disable-next-line no-console
    console.log(`🚀 TrichMind Server running on port ${port}`);

    // Connect Mongo in background
    void connectMongo().catch((err) => {
        // Log Mongo connection error
        const msg = (err as Error)?.message ?? String(err);
        logger.error("❌ Mongo connect failed (background)", { error: msg });
    });

    // Verify SMTP in background (non-blocking)
    void verifyMailer().catch((err) => {
        // Log SMTP verification error
        const msg = (err as Error)?.message ?? String(err);
        logger.warn("📭 SMTP verify threw (ignored)", { error: msg });
    });
});

export default app;
