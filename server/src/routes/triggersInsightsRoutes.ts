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

/**-----------------------------------
    Routes for Triggers & Insights
--------------------------------------*/

// POST /api/triggers-insights
router.post(
    "/",
    authentication({ required: true }),
    validate(TriggersInsightsCreateSchema),
    createTriggersInsights
);

// GET /api/triggers-insights
router.get(
    "/",
    authentication({ required: true }),
    validate(TriggersInsightsListQuerySchema, "query"),
    listTriggersInsights
);

// PUT /api/triggers-insights/:id
router.put(
    "/:id",
    authentication({ required: true }),
    validate(TriggersInsightsUpdateSchema),
    updateTriggersInsights
);

export default router;
