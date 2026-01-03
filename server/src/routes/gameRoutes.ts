// server/src/routes/gameRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createSession,
    listSessions,
    updateSession
} from "../controllers";
import {
    GameSessionCreateSchema,
    GameSessionUpdateSchema,
    GameSessionListQuerySchema,
} from "../schemas";


// Define the router for game-related routes
const router = Router();

// Route to create a new TrichGame session
router.post("/", authentication({ required: true }), validate(GameSessionCreateSchema), createSession);

/**----------------------------------------------------------------
    Route to list TrichGame sessions for the authenticated user
-------------------------------------------------------------------*/

// GET /api/game/sessions
router.get(
    "/",
    authentication({ required: true }),
    validate(GameSessionListQuerySchema, "query"),
    listSessions
);

// Route to update a TrichGame session by ID
router.put("/:id", authentication({ required: true }), validate(GameSessionUpdateSchema), updateSession);

export default router;
