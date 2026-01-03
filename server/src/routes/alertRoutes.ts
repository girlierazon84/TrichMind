// server/src/routes/alertRoutes.ts

import { Router } from "express";
import { sendRelapseAlert } from "../controllers";
import { authentication } from "../middlewares";


const router = Router();

/**---------------------------------
    🔔 POST /api/alerts/relapse
------------------------------------*/
router.post("/relapse", authentication({ required: true }), sendRelapseAlert);

export default router;
