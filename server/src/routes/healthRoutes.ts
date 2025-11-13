// server/src/routes/healthRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createHealthLog,
    listHealthLogs,
    updateHealthLog,
} from "../controllers";
import {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
} from "../schemas";


// Initialize router
const router = Router();

// ✅ Auth required for all routes
router.post("/", authentication(), validate(HealthCreateSchema), createHealthLog);
router.get("/", authentication(), validate(HealthListQuerySchema, "query"), listHealthLogs);
router.put("/:id", authentication(), validate(HealthUpdateSchema), updateHealthLog);

export default router;
