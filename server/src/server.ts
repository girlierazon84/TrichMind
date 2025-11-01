import express from "express";
import cors from "cors";
import { connectMongo } from "./config/mongo";
import { notFound, errorHandler } from "./middlewares/error";
import { startWeeklySummaryScheduler } from "./utils/scheduler";
import { logger } from "./utils/logger";
import { ENV } from "./config/env";

// -----------------------------
// Route Imports
// -----------------------------
import authRoutes from "./routes/authRoutes";
import alertRoutes from "./routes/alertRoutes";
import summaryRoutes from "./routes/summaryRoutes";
import predictRoutes from "./routes/predictRoutes";
console.log("🧠 predictRoutes import value:", predictRoutes);
console.log("🧩 Creating /api/ml routes...");
import userRoutes from "./routes/userRoutes";
import healthRoutes from "./routes/healthRoutes";
import journalRoutes from "./routes/journalRoutes";
import triggersInsightsRoutes from "./routes/triggersInsightsRoutes";
import trichBotRoutes from "./routes/trichBotRoutes";
import trichGameRoutes from "./routes/trichGameRoutes";
import loggerRoutes from "./routes/loggerRoutes";

console.log("🧩 Predict routes loaded:", !!predictRoutes);


// ------------------------------
// Initialize Express App
// ------------------------------
const app = express();

// -----------------------------
// ✅ Middleware
// -----------------------------
app.use(cors({ origin: ENV.CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());

// -----------------------------
// ✅ API Routes
// -----------------------------
app.use("/api/auth", authRoutes);                    // 🔐 Authentication
app.use("/api/alerts", alertRoutes);                 // 🔔 Alerts (relapse risk)
app.use("/api/summary", summaryRoutes);              // 🗓 Weekly summaries
app.use("/api/ml", predictRoutes);                   // 🤖 ML Predictions
console.log("🧩 Predict routes loaded: true");
app.use("/api/users", userRoutes);                   // 👤 User info
app.use("/api/health", healthRoutes);                // 🩺 Health logs
app.use("/api/journal", journalRoutes);              // 📔 Journals
app.use("/api/triggers", triggersInsightsRoutes);    // ⚡ Triggers insights
app.use("/api/trichbot", trichBotRoutes);            // 💬 TrichMind Chatbot logs
app.use("/api/games", trichGameRoutes);              // 🎮 Game sessions
app.use("/api/logs", loggerRoutes);                  // 🪵 Logger

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
    app.listen(ENV.PORT, () => {
        logger.info(`🚀 TrichMind Server running on port ${ENV.PORT}`);
    });
});
