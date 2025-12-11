// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios from "axios";
import { ENV_AUTO } from "../config";
import { validate, authentication } from "../middlewares";
import { PredictSchema, PredictEncodedSchema } from "../schemas";
import { asyncHandler } from "../utils";
import { predictService } from "../services";
import { Predict } from "../models";


/* ──────────────────────────────
    🔹 Predict Routes
──────────────────────────────── */
const router = Router();

// Base FastAPI ML URL (may be empty on Render if not configured)
const rawMlUrl = (ENV_AUTO.ML_BASE_URL || "").trim();
const ML_URL = rawMlUrl.replace(/\/+$/, ""); // normalize, no trailing slash

const hasMlBackend = !!ML_URL;

// Small helper for "ML offline" responses
const mlOfflinePayload = (reason: string) => ({
    ok: false as const,
    error: reason,
    message:
        "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚",
});

/* ------------------------------------------------------
    🔐  POST /api/ml/auth/register → Proxy to FastAPI
---------------------------------------------------------*/
router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

        try {
            console.log("📤 [ML] Forwarding Auth Register:", req.body);

            const { data } = await axios.post(
                `${ML_URL}/auth/register`,
                req.body,
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            console.log("📥 [ML] Register OK:", data);
            res.json(data);
        } catch (error: any) {
            console.error("❌ [ML] Register Failed:", error.message);

            res.status(200).json(
                mlOfflinePayload(
                    error.response?.data?.error || error.message
                )
            );
        }
    })
);

/* ---------------------------------------
    🌡️ GET /api/ml/ping — Health Check
------------------------------------------*/
router.get(
    "/ping",
    asyncHandler(async (_req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

        try {
            const { data } = await axios.get(`${ML_URL}/live`, {
                timeout: 5000,
            });
            return res.status(200).json({ ok: true, ml_response: data });
        } catch (error: any) {
            return res.status(200).json(
                mlOfflinePayload(`Cannot reach ML service at ${ML_URL}`)
            );
        }
    })
);

/* -----------------------------------------------------------------------
    🤖 Helper: forward *friendly* payload to FastAPI /predict_friendly
--------------------------------------------------------------------------*/
async function forwardPredictFriendly(reqBody: any) {
    if (!hasMlBackend) {
        throw new Error("ML backend not configured");
    }

    const { data } = await axios.post(`${ML_URL}/predict_friendly`, reqBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
    });
    return data;
}

/* -----------------------------------------------------------------
    🤖 POST /api/ml         — Wrapped Prediction Route (friendly)
    🤖 POST /api/ml/predict_friendly — Raw Prediction (friendly)
--------------------------------------------------------------------*/

// Wrapped: { ok, prediction } — uses FRIENDLY DTO
router.post(
    "/",
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

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

            return res.status(200).json(
                mlOfflinePayload(
                    error.response?.data?.detail ||
                        error.response?.data?.error ||
                        error.message
                )
            );
        }
    })
);

/* ------------------------------------------------------------------------
    🧩 /api/ml/predict_friendly  → FRIENDLY → FastAPI /predict_friendly
---------------------------------------------------------------------------*/
router.post(
    "/predict_friendly",
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

        try {
            console.log(
                "📤 [ML] Predict Request (/predict_friendly):",
                req.body
            );
            const data = await forwardPredictFriendly(req.body);
            console.log(
                "📥 [ML] Predict OK (/predict_friendly):",
                data
            );

            return res.status(200).json(data);
        } catch (error: any) {
            console.error(
                "❌ [ML] Predict Failed (/predict_friendly):",
                error.message
            );

            return res.status(200).json(
                mlOfflinePayload(
                    error.response?.data?.detail ||
                        error.response?.data?.error ||
                        error.message
                )
            );
        }
    })
);

/* -----------------------------------------------------
    🧩 /api/ml/predict  → ENCODED → FastAPI /predict
--------------------------------------------------------*/
router.post(
    "/predict",
    validate(PredictEncodedSchema),
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

        try {
            console.log(
                "📤 [ML] Predict Request (/predict, encoded):",
                req.body
            );

            const { data } = await axios.post(`${ML_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });

            console.log(
                "📥 [ML] Predict OK (/predict, encoded):",
                data
            );

            return res.status(200).json(data);
        } catch (error: any) {
            console.error(
                "❌ [ML] Predict Failed (/predict, encoded):",
                error.message
            );

            return res.status(200).json(
                mlOfflinePayload(
                    error.response?.data?.detail ||
                        error.response?.data?.error ||
                        error.message
                )
            );
        }
    })
);

/* --------------------------
    📦 POST /api/ml/batch
-----------------------------*/
router.post(
    "/batch",
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) {
            return res.status(200).json(
                mlOfflinePayload("ML backend not configured")
            );
        }

        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    ok: false,
                    error: "Payload must be a non-empty array",
                });
            }

            const { data } = await axios.post(
                `${ML_URL}/batch_predict`,
                payload,
                {
                    headers: { "Content-Type": "application/json" },
                    timeout: 20000,
                }
            );

            return res.status(200).json({
                ok: true,
                batch_summary: data,
            });
        } catch (error: any) {
            console.error("❌ [ML] Batch Failed:", error.message);

            return res.status(200).json(
                mlOfflinePayload(
                    error.response?.data?.detail ||
                        error.response?.data?.error ||
                        error.message
                )
            );
        }
    })
);

/* -------------------------------------
    🤝 POST /api/ml/predict-forecast
----------------------------------------*/
router.post(
    "/predict-forecast",
    authentication({ required: true }),
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        const doc = await predictService.predict(userId, req.body);
        const baseScore =
            typeof doc.risk_score === "number" ? doc.risk_score : 0.5;
        const clampedBase = Math.min(1, Math.max(0, baseScore));

        const trend = Array.from({ length: days }, (_v, i) => {
            const day = i + 1;
            const delta = 0.08 * Math.sin(day / 3);
            const predicted_risk = Math.min(
                1,
                Math.max(0, clampedBase + delta)
            );
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

/* --------------------------------------
    🔮 GET /api/ml/risk-trend?days=14
-----------------------------------------*/
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
            const predicted_risk = Math.min(
                1,
                Math.max(0, clampedBase + delta)
            );
            return { day, predicted_risk };
        });

        return res.json({ trend });
    })
);

router.get(
    "/last",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

        const last = await Predict.findOne({ userId })
            .sort({ createdAt: -1 })
            .lean();

        if (!last) {
            return res
                .status(404)
                .json({ ok: false, error: "No predictions found" });
        }

        return res.json({
            ok: true,
            prediction: {
                risk_score: last.risk_score,
                risk_bucket: last.risk_bucket,
                confidence: last.confidence,
                model_version: last.model_version,
            },
        });
    })
);

/* -------------------------------------------------
    🧪 Test Routes: /api/ml/test/low|medium|high
----------------------------------------------------*/
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

            if (!hasMlBackend) {
                return res.status(200).json(
                    mlOfflinePayload("ML backend not configured")
                );
            }

            try {
                const payload = TEST_INPUTS[level];
                const { data } = await axios.post(
                    `${ML_URL}/predict`,
                    payload,
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );

                return res.json({ ok: true, level, ml_prediction: data });
            } catch (error: any) {
                return res.status(200).json(
                    mlOfflinePayload(
                        error.response?.data?.detail ||
                            error.response?.data?.error ||
                            error.message
                    )
                );
            }
        })
    );
});

export default router;
