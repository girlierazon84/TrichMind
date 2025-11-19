// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios from "axios";
import { ENV } from "../config";
import { validate, authentication } from "../middlewares";
import { PredictDTO, PredictEncodedDTO } from "../schemas";
import { asyncHandler } from "../utils";
import { predictService } from "../services";
import { Predict } from "../models";


/* ──────────────────────────────
    🔹 Predict Routes
──────────────────────────────── */
const router = Router();

// Base FastAPI ML URL
const ML_URL = ENV.ML_BASE_URL || "http://localhost:8000";

/* -----------------------------------------------------------
    🔐  POST /api/ml/auth/register → Proxy to FastAPI
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
    🌡️ GET /api/ml/ping — Health Check
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
    🤖 Helper: forward *friendly* payload to FastAPI /predict_friendly
------------------------------------------------------------ */
async function forwardPredictFriendly(reqBody: any) {
    const { data } = await axios.post(`${ML_URL}/predict_friendly`, reqBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
    });
    return data;
}

/* -----------------------------------------------------------
    🤖 POST /api/ml         — Wrapped Prediction Route (friendly)
    🤖 POST /api/ml/predict_friendly — Raw Prediction (friendly)
------------------------------------------------------------ */

// Wrapped: { ok, prediction } — uses FRIENDLY DTO
router.post(
    "/",
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Predict Request (/):", req.body);
            const data = await forwardPredictFriendly(req.body);
            console.log("📥 [ML] Predict OK (/):", data);

            return res.status(200).json({
                ok: true,
                prediction: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Predict Failed (/):", error.message);

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
    🧩 /api/ml/predict_friendly  → FRIENDLY → FastAPI /predict_friendly
------------------------------------------------------------ */
router.post(
    "/predict_friendly",
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Predict Request (/predict_friendly):", req.body);
            const data = await forwardPredictFriendly(req.body);
            console.log("📥 [ML] Predict OK (/predict_friendly):", data);

            // Frontend expects raw PredictionResponse here
            return res.status(200).json(data);
        } catch (error: any) {
            console.error("❌ [ML] Predict Failed (/predict_friendly):", error.message);

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
    🧩 /api/ml/predict  → ENCODED → FastAPI /predict
    (for legacy / test tools sending encoded features)
------------------------------------------------------------ */
router.post(
    "/predict",
    validate(PredictEncodedDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📤 [ML] Predict Request (/predict, encoded):", req.body);

            const { data } = await axios.post(`${ML_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });

            console.log("📥 [ML] Predict OK (/predict, encoded):", data);

            // Frontend / tools expect raw PredictionResponse here
            return res.status(200).json(data);
        } catch (error: any) {
            console.error("❌ [ML] Predict Failed (/predict, encoded):", error.message);

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
    📦 POST /api/ml/batch
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
    🤝 POST /api/ml/predict-forecast
        1) Calls FastAPI predict via predictService (friendly)
        2) Auto-logs prediction (Predict + HealthLog)
        3) Returns a generated N-day forecast trend
------------------------------------------------------------ */
router.post(
    "/predict-forecast",
    authentication({ required: true }),
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        const doc = await predictService.predict(userId, req.body);
        const baseScore = typeof doc.risk_score === "number" ? doc.risk_score : 0.5;
        const clampedBase = Math.min(1, Math.max(0, baseScore));

        const trend = Array.from({ length: days }, (_v, i) => {
            const day = i + 1;
            const delta = 0.08 * Math.sin(day / 3);
            const predicted_risk = Math.min(1, Math.max(0, clampedBase + delta));
            return { day, predicted_risk };
        });

        return res.status(200).json({
            ok: true,
            prediction: {
                risk_score: clampedBase,
                risk_bucket: doc.risk_bucket,
                confidence: doc.confidence,
                model_version: doc.model_version,
            },
            trend,
        });
    })
);

/* -----------------------------------------------------------
    🔮 GET /api/ml/risk-trend?days=14
------------------------------------------------------------ */
router.get(
    "/risk-trend",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        const last = await Predict.findOne({ userId })
            .sort({ createdAt: -1 })
            .lean();

        const baseScore =
            typeof last?.risk_score === "number" ? last.risk_score : 0.5;
        const clampedBase = Math.min(1, Math.max(0, baseScore));

        const trend = Array.from({ length: days }, (_v, i) => {
            const day = i + 1;
            const delta = 0.08 * Math.sin(day / 3);
            const predicted_risk = Math.min(1, Math.max(0, clampedBase + delta));
            return { day, predicted_risk };
        });

        return res.json({ trend });
    })
);

/* -----------------------------------------------------------
    🧪 Test Routes: /api/ml/test/low|medium|high
    👉 These still talk to FastAPI /predict with *encoded* payloads
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

(["low", "medium", "high"] as RiskTestLevel[]).forEach((level) => {
    router.post(
        `/test/${level}`,
        asyncHandler(async (_req, res) => {
            console.log(`🧪 [Test] ${level.toUpperCase()} → ML`);
            try {
                const payload = TEST_INPUTS[level];
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
