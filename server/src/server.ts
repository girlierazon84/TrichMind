// server/src/server.ts

import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import mongoose from "mongoose";
import { connectMongo, ENV_AUTO } from "./config";
import { notFound, errorHandler, requireMongoReady } from "./middlewares";
import { logger, startWeeklySummaryScheduler } from "./utils";


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
import trichGameRoutes from "./routes/trichGameRoutes";
import loggerRoutes from "./routes/loggerRoutes";
import relapseOverviewRoutes from "./routes/relapseOverviewRoutes";

/**---------------------------
    Initialize Express App
------------------------------*/
const app = express();

/** ✅ IMPORTANT: disable buffering IMMEDIATELY (before any routes)
 *  Otherwise first requests can hang while Mongo connects.
 */
mongoose.set("bufferCommands", false);

/**---------------------------------------------
    🔍 Simple request logger (dev only)
------------------------------------------------*/
if (ENV_AUTO.NODE_ENV !== "production") {
    app.use((req: Request, _res: Response, next: NextFunction) => {
        console.log(`➡️  ${req.method} ${req.originalUrl}`);
        next();
    });
}

/**----------------------------------------
    ✅ CORS – multi-origin, env-driven
-------------------------------------------*/
const envCorsOrigins = Array.isArray(ENV_AUTO.CORS_ORIGINS)
    ? ENV_AUTO.CORS_ORIGINS
    : [];

const fallbackRaw =
    process.env.CORS_ORIGIN ||
    `${ENV_AUTO.CLIENT_URL},http://localhost:5050,http://localhost:5173`;

const fallbackOrigins = fallbackRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const ALLOWED_ORIGINS: string[] = Array.from(
    new Set(envCorsOrigins.length > 0 ? envCorsOrigins : fallbackOrigins)
);

if (ENV_AUTO.NODE_ENV !== "production") {
    console.log("🌐 [CORS] Allowed origins:", ALLOWED_ORIGINS);
}

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        // Allow non-browser tools (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);

        const allowed =
            ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".vercel.app");

        // ✅ IMPORTANT: don’t throw from CORS (can cause ugly 502 behavior via proxies)
        return callback(null, allowed);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

/** ✅ Explicit preflight handler
 *  Use regex instead of "*" to avoid path-to-regexp crash on Express 5.
 */
app.options(/.*/, cors(corsOptions));

/**--------------------------------------------
    ✅ Body parsers (JSON, form-data)
-----------------------------------------------*/
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

/**--------------------------------------
    🧪 Health endpoints
-----------------------------------------*/
app.get("/api/ping", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "pong" });
});

app.get("/api/ready", (_req: Request, res: Response) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({
        ok: ready,
        mongoReadyState: mongoose.connection.readyState,
    });
});

/**--------------------------------------
    ✅ DB Guard (prevents request hangs)
-----------------------------------------*/
const requireMongo = requireMongoReady();

/**-------------------
    ✅ API Routes
----------------------*/
// DB-backed routes guarded
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

// ✅ If /api/ml depends on Mongo, keep guarded; if not, remove requireMongo here.
app.use("/api/ml", requireMongo, predictRoutes);

/**-----------------------------
    ✅ 404 + Error Handlers
--------------------------------*/
app.use(notFound);
app.use(errorHandler);

/**------------------------------------------
    🕒 Scheduler (Weekly Summary Emails)
---------------------------------------------*/
startWeeklySummaryScheduler();

/**---------------------
    🚀 Start Server
------------------------*/
const port = ENV_AUTO.PORT || 8080;

// ✅ Always start HTTP server first (prevents Render 502 during boot)
app.listen(port, () => {
    logger.info(`🚀 TrichMind Server running on port ${port}`);
    console.log(`🚀 TrichMind Server running on port ${port}`);

    // ✅ Connect Mongo in background
    void connectMongo().catch((err) => {
        const msg = (err as Error)?.message ?? String(err);
        logger.error(`❌ Mongo connect failed (background): ${msg}`);
    });
});

export default app;
