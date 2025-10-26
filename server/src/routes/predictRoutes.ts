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
            console.log("📤 Sending request to ML:", ENV.ML_BASE_URL);

            const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, req.body, {
                timeout: 10000,
            });

            console.log("📥 ML Prediction Response:", data);
            return res.json(data);
        } catch (error: any) {
            console.error("❌ ML connection error:", error.message);

            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: "Cannot connect to ML service at " + ENV.ML_BASE_URL,
                });
            }

            if (error.response) {
                return res.status(error.response.status).json({
                    ok: false,
                    error: error.response.data?.error || "ML backend returned error.",
                });
            }

            return res.status(500).json({
                ok: false,
                error: "Unexpected error connecting to ML service.",
            });
        }
    })
);

export default router;
