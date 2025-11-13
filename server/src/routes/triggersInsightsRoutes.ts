// server/src/routes/triggersInsightsRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createTriggersInsights,
    listTriggersInsights,
    updateTriggersInsights,
} from "../controllers";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas";


// Initialize router
const router = Router();

// 🟢 TriggersInsights Routes
router.post("/", authentication(), validate(TriggersInsightsCreateDTO), createTriggersInsights);
router.get("/", authentication(), validate(TriggersInsightsListQuery, "query"), listTriggersInsights);
router.put("/:id", authentication(), validate(TriggersInsightsUpdateDTO), updateTriggersInsights);

export default router;
