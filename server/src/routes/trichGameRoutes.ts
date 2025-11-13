// server/src/routes/gameRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createSession,
    listSessions,
    updateSession,
} from "../controllers";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas";


// Initialize router
const router = Router();

// 🟢 TrichGame Routes
router.post("/", authentication(), validate(GameSessionCreateDTO), createSession);
router.get("/", authentication(), validate(GameSessionListQuery, "query"), listSessions);
router.put("/:id", authentication(), validate(GameSessionUpdateDTO), updateSession);

export default router;
