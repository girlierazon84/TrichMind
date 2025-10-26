// server/src/routes/triggersRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    createTrigger,
    listTriggers,
    updateTrigger,
} from "../controllers/triggersInsightsController";
import {
    TriggerCreateDTO,
    TriggerUpdateDTO,
    TriggerListQuery,
} from "../schemas/triggersInsightsSchema";

const router = Router();

router.post("/", authentication(), validate(TriggerCreateDTO), createTrigger);
router.get("/", authentication(), validate(TriggerListQuery, "query"), listTriggers);
router.put("/:id", authentication(), validate(TriggerUpdateDTO), updateTrigger);

export default router;
