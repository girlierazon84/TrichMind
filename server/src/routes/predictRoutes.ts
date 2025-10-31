// server/src/routes/predictRoutes.ts
import { Router } from "express";
import axios from "axios";
import { ENV } from "../config/env";
import { validate } from "../middlewares/validateMiddleware";
import { PredictDTO } from "../schemas/predictSchema";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
    "/predict",
    validate(PredictDTO),
    asyncHandler(async (req, res) => {
        try {
            console.log("📦 Incoming ML prediction payload:", JSON.stringify(req.body, null, 2));
            console.log("📤 Forwarding ML prediction request to:", `${ENV.ML_BASE_URL}/predict`);

            const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, req.body, {
                timeout: 10000,
                headers: { "Content-Type": "application/json" },
            });

            console.log("📥 ✅ ML Service responded successfully:", data);

            return res.status(200).json({
                ok: true,
                prediction: data,
            });
        } catch (error: any) {
            console.error("❌ ML prediction error:", error.message);

            // 🔌 Connection refused or ML service offline
            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ENV.ML_BASE_URL}`,
                });
            }

            // ⏱ Timeout error
            if (error.code === "ECONNABORTED") {
                return res.status(504).json({
                    ok: false,
                    error: "ML service timed out. Please try again later.",
                });
            }

            // 🧠 Error returned from FastAPI
            if (error.response) {
                const { status, data } = error.response;
                console.error("🧠 ML backend returned:", JSON.stringify(data, null, 2));

                return res.status(status).json({
                    ok: false,
                    error:
                        data?.detail ||
                        data?.error ||
                        data?.message ||
                        "ML backend returned an internal error.",
                    trace: data?.trace || undefined, // optional debug trace from FastAPI
                });
            }

            // 🧩 Unknown unexpected error
            return res.status(500).json({
                ok: false,
                error: "Unexpected error connecting to ML service.",
                details: error?.stack || error?.message,
            });
        }
    }),
);

export default router;
