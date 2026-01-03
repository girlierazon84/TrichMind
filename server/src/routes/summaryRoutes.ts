// server/src/routes/summaryRoutes.ts

import { Router } from "express";
import { sendWeeklySummaries } from "../controllers";
import { authentication } from "../middlewares";


// Initialize the router
const router = Router();

/**----------------------------------
    POST /api/summary/weekly
    Auth optional (admin/testing)
-------------------------------------*/
router.post("/weekly", authentication({ required: false }), sendWeeklySummaries);

export default router;
