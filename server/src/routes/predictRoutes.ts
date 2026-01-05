// server/src/routes/predictRoutes.ts

import { Router } from "express";
import axios, { type AxiosError } from "axios";
import { ENV_AUTO } from "../config";
import { validate, authentication } from "../middlewares";
import { PredictSchema, PredictEncodedSchema } from "../schemas";
import { asyncHandler } from "../utils";
import { predictService } from "../services";
import { Predict } from "../models";


const router = Router();

const rawMlUrl = (ENV_AUTO.ML_BASE_URL || "").trim();
const ML_URL = rawMlUrl.replace(/\/+$/, "");
const hasMlBackend = ML_URL.length > 0;

type MlErrorBody = { detail?: unknown; error?: unknown; message?: unknown };

type OfflinePayload = {
    ok: false;
    error: string;
    message: string;
};

const mlOfflinePayload = (reason: string): OfflinePayload => ({
    ok: false,
    error: reason,
    message:
        "Our TrichMind ML coach is currently offline, but you can still use journaling, triggers and other tools 💚",
});

function axiosErrorReason(err: unknown): string {
    if (!axios.isAxiosError(err)) return err instanceof Error ? err.message : String(err);
    const ax = err as AxiosError<MlErrorBody>;
    const data = ax.response?.data;
    const detail =
        (typeof data?.detail === "string" && data.detail) ||
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        ax.message;
    return detail;
}

async function forwardPredictFriendly(reqBody: unknown): Promise<unknown> {
    if (!hasMlBackend) throw new Error("ML backend not configured");
    const { data } = await axios.post(`${ML_URL}/predict_friendly`, reqBody, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
    });
    return data;
}

/**--------------------------------------
    Proxy: POST /api/ml/auth/register
-----------------------------------------*/
router.post(
    "/auth/register",
    asyncHandler(async (req, res) => {
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));

        try {
            // eslint-disable-next-line no-console
            console.log("📤 [ML] Forwarding Auth Register:", req.body);

            const { data } = await axios.post(`${ML_URL}/auth/register`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 8000,
            });

            return res.json(data);
        } catch (err: unknown) {
            // eslint-disable-next-line no-console
            console.error("❌ [ML] Register Failed:", axiosErrorReason(err));
            return res.status(200).json(mlOfflinePayload(axiosErrorReason(err)));
        }
    })
);

/**---------------------
    GET /api/ml/ping
------------------------*/
router.get(
    "/ping",
    asyncHandler(async (_req, res) => {
        if (!hasMlBackend) return res.status(200).json(mlOfflinePayload("ML backend not configured"));
        try {
            const { data } = await axios.get(`${ML_URL}/live`, { timeout: 5000 });
            return res.status(200).json({ ok: true, ml_response: data });
        } catch (err: unknown) {
            return res.status(200).json(mlOfflinePayload(`Cannot reach ML service at ${ML_URL}`));
        }
    })
);

/**------------------------------------
    POST /api/ml — wrapped friendly
---------------------------------------*/
router.post(
    "/",
    authentication({ required: true }),
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;
        const doc = await predictService.predict(userId, req.body);

        return res.status(201).json({
            ok: true,
            prediction: {
                risk_score: doc.risk_score,
                risk_bucket: doc.risk_bucket,
                confidence: doc.confidence,
                model_version: doc.model_version,
                risk_code: doc.risk_bucket,
            },
        });
    })
);

/**-------------------------------------------------
    POST /api/ml/predict_friendly — STORED friendly
    ✅ uses Mongo + saves Predict + HealthLog snapshot
----------------------------------------------------*/
router.post(
    "/predict_friendly",
    authentication({ required: true }),
    validate(PredictSchema),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

        // ✅ this calls FastAPI AND stores Predict + HealthLog
        const doc = await predictService.predict(userId, req.body);

        return res.status(201).json({
            ok: true,
            prediction: {
                risk_score: doc.risk_score,
                risk_bucket: doc.risk_bucket,
                confidence: doc.confidence,
                model_version: doc.model_version,
                risk_code: doc.risk_bucket, // optional
            },
        });
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

        try {
            const { data } = await axios.post(`${ML_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 15000,
            });
            return res.status(200).json(data);
        } catch (err: unknown) {
            return res.status(200).json(mlOfflinePayload(axiosErrorReason(err)));
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

        const payload: unknown = req.body;
        if (!Array.isArray(payload) || payload.length === 0) {
            return res.status(400).json({ ok: false, error: "Payload must be a non-empty array" });
        }

        try {
            const { data } = await axios.post(`${ML_URL}/batch_predict`, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 20000,
            });

            return res.status(200).json({ ok: true, batch_summary: data });
        } catch (err: unknown) {
            return res.status(200).json(mlOfflinePayload(axiosErrorReason(err)));
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

/**-----------------------------------
    GET /api/ml/risk-trend?days=14
--------------------------------------*/
router.get(
    "/risk-trend",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;
        const days = Number(req.query.days ?? 14);

        const last = await Predict.findOne({ userId }).sort({ createdAt: -1 }).lean();

        const baseScore = typeof last?.risk_score === "number" ? last.risk_score : 0.5;
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

/**---------------------
    GET /api/ml/last
------------------------*/
router.get(
    "/last",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const userId = req.auth!.userId;

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
