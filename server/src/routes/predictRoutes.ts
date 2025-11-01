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
            console.log("📤 [ML] Incoming prediction request:", req.body);

            const { data } = await axios.post(`${ENV.ML_BASE_URL}/predict`, req.body, {
                headers: { "Content-Type": "application/json" },
                timeout: 10000,
            });

            console.log("📥 ✅ ML Service responded successfully:", data);

            return res.status(200).json({
                ok: true,
                prediction: data,
            });
        } catch (error: any) {
            console.error("❌ ML connection error:", error.message);

            // 🔎 Detailed Axios debugging info
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
            } else {
                console.error("🔍 Non-Axios error caught:", error);
            }

            // Connection refused
            if (error.code === "ECONNREFUSED") {
                return res.status(502).json({
                    ok: false,
                    error: `Cannot connect to ML service at ${ENV.ML_BASE_URL}`,
                });
            }

            // Received a response with an error status
            if (error.response) {
                console.error("🧠 ML backend responded with error:", error.response.data);
                return res.status(error.response.status).json({
                    ok: false,
                    error:
                        error.response.data?.detail ||
                        error.response.data?.error ||
                        error.response.data?.message ||
                        "ML backend returned an error response.",
                });
            }

            // Unknown error fallback
            return res.status(500).json({
                ok: false,
                error: "Unexpected error connecting to ML service.",
            });
        }
    })
);
router.get("/ping", (_req, res) => res.json({ ok: true, msg: "ML route reachable" }));


export default router;
