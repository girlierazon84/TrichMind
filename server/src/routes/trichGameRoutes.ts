// server/src/routes/gameRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createSession,
    listSessions,
    updateSession,
} from "../controllers";
import {
    GameSessionCreateSchema,
    GameSessionUpdateSchema,
    GameSessionListQuerySchema,
} from "../schemas";

// Initialize router
const router = Router();

// 🟢 TrichGame Routes
router.post(
    "/",
    authentication(),
    validate(GameSessionCreateSchema),
    createSession
);
router.get(
    "/",
    authentication(),
    validate(GameSessionListQuerySchema, "query"),
    listSessions
);
router.put(
    "/:id",
    authentication(),
    validate(GameSessionUpdateSchema),
    updateSession
);

export default router;
