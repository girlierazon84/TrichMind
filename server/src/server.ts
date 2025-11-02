// server/src/server.ts

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { connectMongo as connectDB } from "./config/mongo";

// Load environment variables
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Connect to DB
connectDB();

// Routes
app.get("/", (_req, res) => {
    res.send("TrichMind API is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
