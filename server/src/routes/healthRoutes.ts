// server/src/routes/healthRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createHealthLog,
    listHealthLogs,
    updateHealthLog,
    getRiskTrend,
} from "../controllers";
import {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
} from "../schemas";


// Define the router
const router = Router();

// Define routes for health logs
router.post("/", authentication({ required: true }), validate(HealthCreateSchema), createHealthLog);

/**-------------------------------------------------
    List health logs with pagination and filters
----------------------------------------------------*/

// GET /api/health
router.get(
    "/",
    authentication({ required: true }),
    validate(HealthListQuerySchema, "query"),
    listHealthLogs
);

// GET /api/health/risk-trend
router.get("/risk-trend", authentication({ required: true }), getRiskTrend);

// PUT /api/health/:id
router.put("/:id", authentication({ required: true }), validate(HealthUpdateSchema), updateHealthLog);

export default router;
