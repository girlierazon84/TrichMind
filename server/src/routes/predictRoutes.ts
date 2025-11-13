// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios from "axios";
import { ENV } from "../config";
import { validate } from "../middlewares";
import { PredictDTO } from "../schemas";
import { asyncHandler } from "../utils";

const router = Router();

// Base FastAPI ML URL
const ML_URL = ENV.ML_BASE_URL || "http://localhost:8000";

/* -----------------------------------------------------------
    🔐  /api/predict/auth/register → Proxy to FastAPI
------------------------------------------------------------ */
router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Forwarding Auth Register:", req.body);

            const { data } = await axios.post(`${ML_URL}/auth/register`, req.body, {
                headers: { "Content-Type": "application/json" },
            });

            console.log("📥 [ML] Register OK:", data);
            res.json(data);
        } catch (error: any) {
            console.error("❌ [ML] Register Failed:", error.message);

            res.status(error.response?.status || 500).json({
                ok: false,
                error: error.response?.data || error.message,
            });
        }
    })
);

/* -----------------------------------------------------------
    🌡️ GET /api/predict/ping — Health Check
------------------------------------------------------------ */
router.get(
    "/ping",
    asyncHandler(async (_req, res) => {
        try {
            const { data } = await axios.get(`${ML_URL}/live`, { timeout: 5000 });
            return res.status(200).json({ ok: true, ml_response: data });
        } catch (error: any) {
            return res.status(500).json({
                ok: false,
                error: `Cannot reach ML service at ${ML_URL}`,
            });
        }
    })
);

/* -----------------------------------------------------------
    🤖 POST /api/predict — Main Prediction Route
------------------------------------------------------------ */
router.post(
    "/",
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Predict Request:", req.body);

            const { data } = await axios.post(`${ML_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });

            console.log("📥 [ML] Predict OK:", data);

            return res.status(200).json({
                ok: true,
                prediction: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Predict Failed:", error.message);

            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ML_URL}`,
                });
            }

            return res.status(error.response?.status || 500).json({
                ok: false,
                error:
                    error.response?.data?.detail ||
                    error.response?.data?.error ||
                    error.message,
            });
        }
    })
);

/* -----------------------------------------------------------
    📦 POST /api/predict/batch
------------------------------------------------------------ */
router.post(
    "/batch",
    asyncHandler(async (req, res) => {
        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    ok: false,
                    error: "Payload must be a non-empty array",
                });
            }

            const { data } = await axios.post(`${ML_URL}/batch_predict`, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 20000,
            });

            return res.status(200).json({
                ok: true,
                batch_summary: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Batch Failed:", error.message);

            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ML_URL}`,
                });
            }

            return res.status(error.response?.status || 500).json({
                ok: false,
                error: error.response?.data || error.message,
            });
        }
    })
);

/* -----------------------------------------------------------
    🧪 Built-In Test Routes (low/medium/high)
------------------------------------------------------------ */
type RiskTestLevel = "low" | "medium" | "high";

interface TestInputPayload {
    pulling_severity: number;
    pulling_frequency_encoded: number;
    awareness_level_encoded: number;
    how_long_stopped_days_est: number;
    successfully_stopped_encoded: number;
    years_since_onset: number;
    age: number;
    age_of_onset: number;
    emotion_intensity_sum: number;
    anxiety_level: number;
    depression_level: number;
    coping_strategies_effective: number;
    sleep_quality_score: number;
}

const TEST_INPUTS: Record<RiskTestLevel, TestInputPayload> = {
    low: {
        pulling_severity: 7.4,
        pulling_frequency_encoded: 1,
        awareness_level_encoded: 0.9,
        how_long_stopped_days_est: 180,
        successfully_stopped_encoded: 1,
        years_since_onset: 2,
        age: 25,
        age_of_onset: 23,
        emotion_intensity_sum: 1.0,
        anxiety_level: 0.2,
        depression_level: 0.2,
        coping_strategies_effective: 1,
        sleep_quality_score: 9,
    },
    medium: {
        pulling_severity: 7.5,
        pulling_frequency_encoded: 3,
        awareness_level_encoded: 0.5,
        how_long_stopped_days_est: 30,
        successfully_stopped_encoded: 0,
        years_since_onset: 6,
        age: 29,
        age_of_onset: 23,
        emotion_intensity_sum: 5.0,
        anxiety_level: 0.6,
        depression_level: 0.5,
        coping_strategies_effective: 0,
        sleep_quality_score: 6,
    },
    high: {
        pulling_severity: 8.5,
        pulling_frequency_encoded: 5,
        awareness_level_encoded: 0.2,
        how_long_stopped_days_est: 1,
        successfully_stopped_encoded: 0,
        years_since_onset: 12,
        age: 32,
        age_of_onset: 20,
        emotion_intensity_sum: 9.0,
        anxiety_level: 0.9,
        depression_level: 0.8,
        coping_strategies_effective: 0,
        sleep_quality_score: 3,
    },
};

// Register test endpoints
(["low", "medium", "high"] as RiskTestLevel[]).forEach((level) => {
    router.post(
        `/test/${level}`,
        asyncHandler(async (_req, res) => {
            console.log(`🧪 [Test] ${level.toUpperCase()} → ML`);

            try {
                const payload = TEST_INPUTS[level]; // now fully typed
                const { data } = await axios.post(`${ML_URL}/predict`, payload, {
                    headers: { "Content-Type": "application/json" },
                });

                return res.json({ ok: true, level, ml_prediction: data });
            } catch (error: any) {
                return res.status(500).json({
                    ok: false,
                    error: error.response?.data || error.message,
                });
            }
        })
    );
});

export default router;
