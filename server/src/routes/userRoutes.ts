// server/src/routes/userRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import User from "../models/User";
import HealthLog from "../models/HealthLog";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get(
    "/profile",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const user = await User.findById(req.auth!.userId).select("-password").lean();
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ ok: true, user });
    })
);

router.get(
    "/health/latest",
    authentication({ required: true }),
    asyncHandler(async (req, res) => {
        const log = await HealthLog.findOne({ userId: req.auth!.userId })
            .sort({ date: -1 })
            .lean();
        res.json({ ok: true, latest: log || {} });
    })
);

export default router;
