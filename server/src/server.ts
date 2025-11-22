// server/src/server.ts

import express from "express";
import cors from "cors";
import { connectMongo } from "./config";
import { notFound, errorHandler } from "./middlewares";
import { logger, startWeeklySummaryScheduler } from "./utils";
import { ENV_AUTO } from "./config";

// -----------------
// Route Imports
// -----------------
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

// -------------------------
// Initialize Express App
// -------------------------
const app = express();

// -----------------------------
// ✅ CORS Middleware (multi-origin)
// -----------------------------
const allowedOrigins = ENV_AUTO.CORS_ORIGINS || [ENV_AUTO.CLIENT_URL];

app.use(
    cors({
        origin(origin, callback) {
            // Allow non-browser tools (Postman, curl, etc.)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            logger.warn(`[CORS] Blocked origin: ${origin}`);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

app.use(express.json());

// -----------------------------
// ✅ API Routes
// -----------------------------
app.use("/api/alerts", alertRoutes);                 // 🔔 Alerts (relapse risk)
app.use("/api/auth", authRoutes);                    // 🔐 Authentication
app.use("/api/health", healthRoutes);                // 🩺 Health logs
app.use("/api/journal", journalRoutes);              // 📔 Journals
app.use("/api/logs", loggerRoutes);                  // 🪵 Logger
app.use("/api/ml", predictRoutes);                   // 🤖 ML Predictions
app.use("/api/summary", summaryRoutes);              // 🗓 Weekly summaries
app.use("/api/trichbot", trichBotRoutes);            // 💬 TrichMind Chatbot logs
app.use("/api/games", trichGameRoutes);              // 🎮 Game sessions
app.use("/api/triggers", triggersInsightsRoutes);    // ⚡ Triggers insights
app.use("/api/users", userRoutes);                   // 👤 User info

// -----------------------------
// ✅ 404 + Error Handlers
// -----------------------------
app.use(notFound);
app.use(errorHandler);

// --------------------------------------
// 🕒 Scheduler (Weekly Summary Emails)
// --------------------------------------
startWeeklySummaryScheduler();

// -----------------------------
// 🚀 Start Server
// -----------------------------
connectMongo().then(() => {
    app.listen(ENV_AUTO.PORT, () => {
        logger.info(`🚀 TrichMind Server running on port ${ENV_AUTO.PORT}`);
        logger.info(`✅ Allowed CORS origins: ${allowedOrigins.join(", ")}`);
    });
});
