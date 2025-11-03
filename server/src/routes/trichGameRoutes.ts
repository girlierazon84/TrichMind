// server/src/routes/gameRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    createSession,
    listSessions,
    updateSession,
} from "../controllers/trichGameController";
import {
    GameSessionCreateDTO,
    GameSessionUpdateDTO,
    GameSessionListQuery,
} from "../schemas/trichGameSchema";


// Initialize router
const router = Router();

// 🟢 TrichGame Routes
router.post("/", authentication(), validate(GameSessionCreateDTO), createSession);
router.get("/", authentication(), validate(GameSessionListQuery, "query"), listSessions);
router.put("/:id", authentication(), validate(GameSessionUpdateDTO), updateSession);

export default router;
