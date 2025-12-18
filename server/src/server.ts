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

console.log("🌐 [CORS] Allowed origins:", ALLOWED_ORIGINS);

const corsOptions: CorsOptions = {
    origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));

/**--------------------------------------------
    ✅ Body parsers (JSON, form-data)
-----------------------------------------------*/
app.use(
    express.json({
        limit: "5mb",
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
-----------------------------------------*/
app.get("/api/ping", (_req: Request, res: Response) => {
    res.json({ ok: true, message: "pong" });
});

/**-------------------
    ✅ API Routes
----------------------*/
app.use("/api/alerts", alertRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/logs", loggerRoutes);
app.use("/api/ml", predictRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/trichbot", trichBotRoutes);
app.use("/api/games", trichGameRoutes);
app.use("/api/triggers", triggersInsightsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/overview", relapseOverviewRoutes);

/**-----------------------------
    ✅ 404 + Error Handlers
--------------------------------*/
app.use(notFound);
app.use(errorHandler);

/**---------------------
    🚀 Start Server
------------------------*/
const port = ENV_AUTO.PORT || 8080;

async function start() {
    try {
        // ✅ Connect first so auth/register won't hang on buffered queries
        await connectMongo();

        app.listen(port, () => {
            logger.info(`🚀 TrichMind Server running on port ${port}`);
            console.log(`🚀 TrichMind Server running on port ${port}`);
        });

        // ✅ Start scheduler after server + (attempted) DB connect
        startWeeklySummaryScheduler();
    } catch (err) {
        const msg = (err as Error)?.message ?? String(err);

        // ✅ FIX: your logger.error appears typed to accept ONE argument only
        logger.error(`❌ Failed to start server (Mongo connect failed): ${msg}`);

        process.exit(1);
    }
}

void start();

export default app;
