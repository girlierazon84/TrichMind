import express from "express";
import cors from "cors";
import { connectMongo } from "./config/mongo";
import { notFound, errorHandler } from "./middlewares/error";
import { logger } from "./utils/logger";
import authRoutes from "./routes/authRoutes";
import { ENV } from "./config/env";

const app = express();

// Middleware
app.use(cors({ origin: ENV.CORS_ORIGIN.split(","), credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// 404 + Error Handlers
app.use(notFound);
app.use(errorHandler);

// Start server
connectMongo().then(() => {
    app.listen(ENV.PORT, () => {
        logger.info(`🚀 TrichMind Server running on port ${ENV.PORT}`);
    });
});
