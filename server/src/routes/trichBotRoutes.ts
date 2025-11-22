// server/src/routes/trichBotRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import { createMessage, listMessages } from "../controllers";
import {
    TrichBotCreateSchema,
    TrichBotListQuerySchema,
} from "../schemas";

// Initialize router
const router = Router();

// 🟢 TrichBot Routes
router.post(
    "/",
    authentication(),
    validate(TrichBotCreateSchema),
    createMessage
);
router.get(
    "/",
    authentication(),
    validate(TrichBotListQuerySchema, "query"),
    listMessages
);

export default router;
