// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios from "axios";
import { ENV } from "../config/env";
import { validate } from "../middlewares/validateMiddleware";
import { PredictDTO } from "../schemas/predictSchema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**───────────────────────────────────────────────────────────────
🌡️  GET /api/predict/ping — Health check for ML service
Verifies connection to FastAPI ML backend.
────────────────────────────────────────────────────────────────**/
router.get(
    "/ping",
    asyncHandler(async (_req, res) => {
        try {
            const { data } = await axios.get(`${ENV.ML_BASE_URL}/live`, {
                timeout: 5000,
            });
            console.log("✅ [ML] Service is live:", data);
            return res.status(200).json({ ok: true, ml_response: data });
        } catch (error: any) {
            console.error("❌ [ML] Service unreachable:", error.message);
            return res.status(500).json({
                ok: false,
                error: `Cannot reach ML service at ${ENV.ML_BASE_URL}`,
            });
        }
    })
);

/**───────────────────────────────────────────────────────────────
🧠 POST /api/predict — Forwards user input to ML model for inference
────────────────────────────────────────────────────────────────**/
router.post(
    "/predict",
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Incoming prediction request:", req.body);

            const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });

            console.log("📥 ✅ [ML] Prediction received:", data);
            return res.status(200).json({
                ok: true,
                prediction: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Prediction request failed:", error.message);

            if (error.isAxiosError) {
                console.error("🔍 Axios error details:", {
                    code: error.code,
                    message: error.message,
                    url: error.config?.url,
                    method: error.config?.method,
                    sentData: error.config?.data,
                    responseStatus: error.response?.status,
                    responseData: error.response?.data,
                });
            }

            // Specific handling
            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ENV.ML_BASE_URL}`,
                });
            }

            if (error.response) {
                return res.status(error.response.status).json({
                    ok: false,
                    error:
                        error.response.data?.detail ||
                        error.response.data?.error ||
                        error.response.data?.message ||
                        "ML backend returned an error.",
                });
            }

            return res.status(500).json({
                ok: false,
                error: "Unexpected error connecting to ML service.",
            });
        }
    })
);

/**───────────────────────────────────────────────────────────────
📦 POST /api/predict/batch — Send multiple user records at once
Forwards an array of inputs to FastAPI /batch_predict endpoint.
────────────────────────────────────────────────────────────────**/
router.post(
    "/batch",
    asyncHandler(async (req, res) => {
        try {
            const payload = req.body;

            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    ok: false,
                    error: "Request body must be a non-empty array of prediction objects.",
                });
            }

            console.log(`📤 [ML] Sending batch of ${payload.length} records...`);

            const { data } = await axios.post(`${ENV.ML_BASE_URL}/batch_predict`, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 20000,
            });

            console.log("📥 ✅ [ML] Batch prediction successful:", data);
            return res.status(200).json({
                ok: true,
                batch_summary: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Batch prediction failed:", error.message);

            if (error.isAxiosError && error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ENV.ML_BASE_URL}`,
                });
            }

            if (error.response) {
                return res.status(error.response.status).json({
                    ok: false,
                    error: error.response.data?.detail || error.response.data?.message,
                });
            }

            return res.status(500).json({
                ok: false,
                error: "Unexpected error during batch prediction.",
            });
        }
    })
);

/**───────────────────────────────────────────────────────────────
🧪 POST /api/predict/test/low|medium|high — Built-in ML test routes
These routes use known synthetic payloads to test if the ML backend
is correctly predicting low / medium / high risk categories.
────────────────────────────────────────────────────────────────**/

// Test payloads (same structure as PredictDTO)
const TEST_INPUTS = {
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

// Register built-in test routes
["low", "medium", "high"].forEach((level) => {
    router.post(
        `/test/${level}`,
        asyncHandler(async (_req, res) => {
            console.log(`🧪 [Test] Sending ${level.toUpperCase()} risk input to ML...`);
            try {
                const { data } = await axios.post(
                    `${ENV.ML_BASE_URL}/predict`,
                    TEST_INPUTS[level as keyof typeof TEST_INPUTS],
                    { headers: { "Content-Type": "application/json" } }
                );
                console.log(`✅ [Test] ${level.toUpperCase()} result:`, data);
                return res.status(200).json({
                    ok: true,
                    level,
                    ml_prediction: data,
                });
            } catch (error: any) {
                console.error(`❌ [Test] ${level.toUpperCase()} failed:`, error.message);
                return res.status(500).json({
                    ok: false,
                    error: `Test ${level} request failed: ${error.message}`,
                });
            }
        })
    );
});

export default router;
