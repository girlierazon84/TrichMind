// server/src/routes/triggersRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    createTriggersInsights,
    listTriggersInsights,
    updateTriggersInsights,
} from "../controllers/triggersInsightsController";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas/triggersInsightsSchema";

const router = Router();

router.post("/", authentication(), validate(TriggersInsightsCreateDTO), createTriggersInsights);
router.get("/", authentication(), validate(TriggersInsightsListQuery, "query"), listTriggersInsights);
router.put("/:id", authentication(), validate(TriggersInsightsUpdateDTO), updateTriggersInsights);

export default router;
