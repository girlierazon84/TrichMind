// server/src/controllers/relapseOverviewController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { getRelapseOverviewForUser } from "../services";


/**--------------------------------------
    GET /api/overview/relapse
-----------------------------------------*/
export const getRelapseOverviewController = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const overview = await getRelapseOverviewForUser(userId);
    return res.status(200).json(overview);
});

export default getRelapseOverviewController;
