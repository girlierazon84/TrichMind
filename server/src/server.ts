// server/src/server.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
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
-------------------------------------------*/
const rawOrigins =
    process.env.CORS_ORIGIN ||
    `${ENV_AUTO.CLIENT_URL},http://localhost:5050,http://localhost:5173,http://172.19.192.1:5173`;

// Parse and clean origins
const ALLOWED_ORIGINS = rawOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

// Log allowed origins
console.log("🌐 [CORS] Allowed origins:", ALLOWED_ORIGINS);

// CORS middleware
app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser tools (Postman, curl, etc.)
            if (!origin) return callback(null, true);

            if (ALLOWED_ORIGINS.includes(origin)) {
                return callback(null, true);
            }

            console.warn("[CORS] Blocked origin:", origin);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

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
