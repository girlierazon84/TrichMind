// server/src/routes/relapseOverviewRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares";
import { getRelapseOverviewController } from "../controllers";


// Initialize router
const router = Router();

/**------------------------------
    GET /api/overview/relapse
---------------------------------*/
router.get("/relapse", authentication({ required: true }), getRelapseOverviewController);

export default router;
