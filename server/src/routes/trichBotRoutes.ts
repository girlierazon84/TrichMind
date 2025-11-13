// server/src/routes/trichBotRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import { createMessage, listMessages } from "../controllers";
import {
    TrichBotCreateDTO,
    TrichBotListQuery,
} from "../schemas";


// Initialize router
const router = Router();

// 🟢 TrichBot Routes
router.post("/", authentication(), validate(TrichBotCreateDTO), createMessage);
router.get("/", authentication(), validate(TrichBotListQuery, "query"), listMessages);

export default router;
