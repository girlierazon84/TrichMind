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
    TrichBotCreateSchema,
    TrichBotListQuerySchema,
    TrichBotFeedbackSchema,
} from "../schemas";


// Initialize router
const router = Router();

/**------------------------
    Base: /api/trichbot
---------------------------*/

// Create (LLM + save)
router.post(
    "/",
    authentication({ required: true }),
    validate(TrichBotCreateSchema),
    createMessage
);

// List (pagination/sort)
router.get(
    "/",
    authentication({ required: true }),
    validate(TrichBotListQuerySchema, "query"),
    listMessages
);

// Feedback
router.put(
    "/:id/feedback",
    authentication({ required: true }),
    validate(TrichBotFeedbackSchema),
    updateMessageFeedback
);

// Clear history
router.delete(
    "/history",
    authentication({ required: true }),
    clearMessages
);

export default router;
