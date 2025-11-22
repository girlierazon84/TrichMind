// server/src/routes/triggersInsightsRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createTriggersInsights,
    listTriggersInsights,
    updateTriggersInsights,
} from "../controllers";
import {
    TriggersInsightsCreateSchema,
    TriggersInsightsUpdateSchema,
    TriggersInsightsListQuerySchema,
} from "../schemas";

// Initialize router
const router = Router();

// 🟢 TriggersInsights Routes
router.post(
    "/",
    authentication(),
    validate(TriggersInsightsCreateSchema),
    createTriggersInsights
);
router.get(
    "/",
    authentication(),
    validate(TriggersInsightsListQuerySchema, "query"),
    listTriggersInsights
);
router.put(
    "/:id",
    authentication(),
    validate(TriggersInsightsUpdateSchema),
    updateTriggersInsights
);

export default router;
