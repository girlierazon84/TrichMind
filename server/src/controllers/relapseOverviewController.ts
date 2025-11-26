// server/src/controllers/relapseOverviewController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { getRelapseOverviewForUser } from "../services/relapseOverview.service";

/**
 * GET /api/overview/relapse
 * Requires authentication middleware to have set req.user.
 */
export const getRelapseOverviewController = asyncHandler(
    async (req: Request, res: Response) => {
        const authUser: any = (req as any).user;

        if (!authUser || !authUser._id) {
            return res.status(401).json({
                ok: false,
                error: "Unauthorized",
            });
        }

        const overview = await getRelapseOverviewForUser(authUser._id);

        return res.status(200).json(overview);
    }
);
