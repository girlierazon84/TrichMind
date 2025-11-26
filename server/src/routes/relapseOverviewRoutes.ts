// server/src/routes/relapseOverviewRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import { getRelapseOverviewController } from "../controllers";

const router = Router();

// /api/overview/relapse
router.get(
    "/relapse",
    authentication({ required: true }),
    getRelapseOverviewController
);

export default router;
