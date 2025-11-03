// server/src/routes/trichBotRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { createMessage, listMessages } from "../controllers/trichBotController";
import {
    TrichBotCreateDTO,
    TrichBotListQuery,
} from "../schemas/trichBotSchema";


// Initialize router
const router = Router();

// 🟢 TrichBot Routes
router.post("/", authentication(), validate(TrichBotCreateDTO), createMessage);
router.get("/", authentication(), validate(TrichBotListQuery, "query"), listMessages);

export default router;
