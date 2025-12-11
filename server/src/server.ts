// server/src/server.ts

import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { connectMongo, ENV_AUTO } from "./config";
import { notFound, errorHandler } from "./middlewares";
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

/**---------------------------------------------
    🔍 Simple request logger (debug in dev)
------------------------------------------------*/
app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`➡️  ${req.method} ${req.originalUrl}`);
    next();
});

/**----------------------------------------
    ✅ CORS – multi-origin, env-driven
    Uses ENV_AUTO.CORS_ORIGINS from env.auto.ts
-------------------------------------------*/

// Prefer the precomputed array from ENV_AUTO.
// It is always an array according to env.auto.ts.
const envCorsOrigins = Array.isArray(ENV_AUTO.CORS_ORIGINS)
    ? ENV_AUTO.CORS_ORIGINS
    : [];

// Fallback: parse from CORS_ORIGIN or CLIENT_URL + localhost ports
const fallbackRaw =
    process.env.CORS_ORIGIN ||
    `${ENV_AUTO.CLIENT_URL},http://localhost:5050,http://localhost:5173`;

const fallbackOrigins = fallbackRaw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

// Final allowed origins list (deduped)
const ALLOWED_ORIGINS: string[] = Array.from(
    new Set(envCorsOrigins.length > 0 ? envCorsOrigins : fallbackOrigins)
);

console.log("🌐 [CORS] Allowed origins:", ALLOWED_ORIGINS);

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        // Allow non-browser tools (Postman, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        // Allow any Vercel preview URL: https://xxxxx.vercel.app
        if (origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// This is enough – handles preflight too
app.use(cors(corsOptions));

/**--------------------------------------------
    ✅ Body parsers (JSON, form-data)
    (supports avatar base64, profile forms)
-----------------------------------------------*/
app.use(
    express.json({
        limit: "5mb", // allow profile payloads with base64 avatar
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "5mb",
    })
);

/**--------------------------------------
    🧪 Simple health / ping endpoint
    (helps debug ERR_EMPTY_RESPONSE)
-----------------------------------------*/
app.get("/api/ping", (_req: Request, res: Response) => {
    console.log("👋 /api/ping hit");
    res.json({ ok: true, message: "pong" });
});

/**-------------------
    ✅ API Routes
----------------------*/
app.use("/api/alerts", alertRoutes); // 🔔 Alerts (relapse risk)
app.use("/api/auth", authRoutes); // 🔐 Authentication (+ /me)
app.use("/api/health", healthRoutes); // 🩺 Health logs
app.use("/api/journal", journalRoutes); // 📔 Journals
app.use("/api/logs", loggerRoutes); // 🪵 Logger
app.use("/api/ml", predictRoutes); // 🤖 ML Predictions (FastAPI bridge)
app.use("/api/summary", summaryRoutes); // 🗓 Weekly summaries
app.use("/api/trichbot", trichBotRoutes); // 💬 TrichMind Chatbot logs
app.use("/api/games", trichGameRoutes); // 🎮 Game sessions
app.use("/api/triggers", triggersInsightsRoutes); // ⚡ Triggers insights
app.use("/api/users", userRoutes); // 👤 User info & profile
app.use("/api/overview", relapseOverviewRoutes); // 📊 Relapse Overview

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

app.listen(port, () => {
    logger.info(`🚀 TrichMind Server running on port ${port}`);
    console.log(`🚀 TrichMind Server running on port ${port}`);

    // Connect to MongoDB in the background
    void connectMongo();
});

export default app;
