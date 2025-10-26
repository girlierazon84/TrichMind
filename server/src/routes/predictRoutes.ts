// server/src/routes/predictRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { predictRelapseRisk } from "../controllers/predictController";
import { PredictDTO } from "../schemas/predictSchema";

const router = Router();

router.post("/", authentication(), validate(PredictDTO), predictRelapseRisk);

export default router;
