// server/src/routes/trichBotRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createMessage,
    listMessages,
    updateMessageFeedback,
    clearMessages,
} from "../controllers";
import {
    TrichBotCreateDTO,
    TrichBotListQuery,
    TrichBotFeedbackDTO,
} from "../schemas";


// Initialize router
// This router is typically mounted under `/api/trichbot`
const router = Router();

/** ----------------------------------------
 * 🧠 TrichBot Routes
 * Base path: /api/trichbot
 * ----------------------------------------*/

// 👉 Create a new TrichBot message (LLM call + Mongo save)
router.post(
    "/",
    authentication({ required: true }),
    validate(TrichBotCreateDTO),
    createMessage
);

// 👉 List messages with pagination & sorting
router.get(
    "/",
    authentication({ required: true }),
    validate(TrichBotListQuery, "query"),
    listMessages
);

// 👉 Update feedback on a specific TrichBot message
router.put(
    "/:id/feedback",
    authentication({ required: true }),
    validate(TrichBotFeedbackDTO),
    updateMessageFeedback
);

// 👉 Clear all TrichBot messages for the current user
router.delete(
    "/history",
    authentication({ required: true }),
    clearMessages
);

export default router;
