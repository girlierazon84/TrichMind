// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios from "axios";
import { ENV_AUTO } from "../config";
import { validate, authentication } from "../middlewares";
import { PredictSchema, PredictEncodedSchema } from "../schemas";
import { asyncHandler } from "../utils";
import { predictService } from "../services";
import { Predict } from "../models";


// Create the router
const router = Router();

// Prepare ML backend URL
const rawMlUrl = (ENV_AUTO.ML_BASE_URL || "").trim();
const ML_URL = rawMlUrl.replace(/\/+$/, "");
const hasMlBackend = !!ML_URL;

// Standardized offline response
const mlOfflinePayload = (reason: string) => ({
    ok: false as const,
    error: reason,
    message:
        "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚",
});

/**--------------------------------------
    Proxy: POST /api/ml/auth/register
-----------------------------------------*/
router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
        // If no ML backend, respond with offline payload
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        // Forward registration request to ML backend
        try {
            // eslint-disable-next-line no-console
            console.log("📤 [ML] Forwarding Auth Register:", req.body);

            // Forward the request to the ML service
            const { data } = await axios.post(`${ML_URL}/auth/register`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 8000,
            });

            return res.json(data);
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error("❌ [ML] Register Failed:", error.message);

            return res.status(200).json(
                mlOfflinePayload(error.response?.data?.error || error.message)
            );
        }
    })
);

/**---------------------
    GET /api/ml/ping
------------------------*/
router.get(
    "/ping",
    asyncHandler(async (_req, res) => {
        // Get ML service status
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));
        try {
            // Ping the ML service
            const { data } = await axios.get(`${ML_URL}/live`, { timeout: 5000 });
            return res.status(200).json({ ok: true, ml_response: data });
        } catch {
            return res.status(200).json(mlOfflinePayload(`Cannot reach ML service at ${ML_URL}`));
        }
    })
);

// Helper to forward predict_friendly requests
async function forwardPredictFriendly(reqBody: any) {
    if (!hasMlBackend) throw new Error("ML backend not configured");
    const { data } = await axios.post(`${ML_URL}/predict_friendly`, reqBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
    });
    return data;
}

/**------------------------------------
    POST /api/ml — wrapped friendly
---------------------------------------*/
router.post(
    "/",
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        // Forward the request to the ML backend
        try {
            // Forward prediction request
            const data = await forwardPredictFriendly(req.body);
            return res.status(200).json({ ok: true, prediction: data });
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

/**-------------------------------------------------
    POST /api/ml/predict_friendly — raw friendly
----------------------------------------------------*/
router.post(
    "/predict_friendly",
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        // Forward the request to the ML backend
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        // Forward prediction request
        try {
            const data = await forwardPredictFriendly(req.body);
            return res.status(200).json(data);
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

/**-----------------------------------
    POST /api/ml/predict — encoded
--------------------------------------*/
router.post(
    "/predict",
    validate(PredictEncodedSchema),
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        // Forward prediction request
        try {
            const { data } = await axios.post(`${ML_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });
            return res.status(200).json(data);
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

/**-----------------------
    POST /api/ml/batch
--------------------------*/
router.post(
    "/batch",
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        // Forward batch prediction request
        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({ ok: false, error: "Payload must be a non-empty array" });
            }

            // Call ML backend for batch predictions
            const { data } = await axios.post(`${ML_URL}/batch_predict`, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 20000,
            });

            return res.status(200).json({ ok: true, batch_summary: data });
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

/**----------------------------------
    POST /api/ml/predict-forecast
-------------------------------------*/
router.post(
    "/predict-forecast",
    authentication({ required: true }),
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        // Simulate a risk trend forecast based on the current prediction
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        // Get the current prediction
        const doc = await predictService.predict(userId, req.body);
        const baseScore = typeof doc.risk_score === "number" ? doc.risk_score : 0.5;
        const clampedBase = Math.min(1, Math.max(0, baseScore));

        // Generate a simple sinusoidal trend around the base score
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

/**-----------------------------------
    GET /api/ml/risk-trend?days=14
--------------------------------------*/
router.get(
    "/risk-trend",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Simulate a risk trend forecast based on the last prediction
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        // Fetch the last prediction for the user
        const last = await Predict.findOne({ userId }).sort({ createdAt: -1 }).lean();

        // Generate a simple sinusoidal trend around the last risk score
        const baseScore = typeof last?.risk_score === "number" ? last.risk_score : 0.5;
        const clampedBase = Math.min(1, Math.max(0, baseScore));

        // Generate trend data
        const trend = Array.from({ length: days }, (_v, i) => {
            const day = i + 1;
            const delta = 0.08 * Math.sin(day / 3);
            const predicted_risk = Math.min(1, Math.max(0, clampedBase + delta));
            return { day, predicted_risk };
        });

        return res.json({ trend });
    })
);

/**---------------------
    GET /api/ml/last
------------------------*/
router.get(
    "/last",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Fetch the last prediction for the authenticated user
        const userId = req.auth!.userId;

        // Get the most recent prediction
        const last = await Predict.findOne({ userId }).sort({ createdAt: -1 }).lean();
        if (!last) return res.status(404).json({ ok: false, error: "No predictions found" });

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

/**---------------------
    GET /api/ml/last
------------------------*/
router.get(
    "/last",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        // Fetch the last prediction for the authenticated user
        const userId = req.auth!.userId;

        // Get the most recent prediction
        const last = await Predict.findOne({ userId }).sort({ createdAt: -1 }).lean();
        if (!last) return res.status(404).json({ ok: false, error: "No predictions found" });

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

export default router;
