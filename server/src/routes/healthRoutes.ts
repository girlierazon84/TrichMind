// server/src/routes/healthRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    createHealthLog,
    listHealthLogs,
    updateHealthLog,
} from "../controllers/healthController";
import {
    HealthCreateSchema,
    HealthUpdateSchema,
    HealthListQuerySchema,
} from "../schemas/healthSchema";

const router = Router();

// ✅ Auth required for all routes
router.post("/", authentication(), validate(HealthCreateSchema), createHealthLog);
router.get("/", authentication(), validate(HealthListQuerySchema, "query"), listHealthLogs);
router.put("/:id", authentication(), validate(HealthUpdateSchema), updateHealthLog);

export default router;
