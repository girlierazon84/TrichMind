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
const router = Router();

// 🟢 TrichBot Routes
router.post(
    "/",
    authentication({ required: true }),
    validate(TrichBotCreateDTO),
    createMessage
);

router.get(
    "/",
    authentication({ required: true }),
    validate(TrichBotListQuery, "query"),
    listMessages
);

router.put(
    "/:id/feedback",
    authentication({ required: true }),
    validate(TrichBotFeedbackDTO),
    updateMessageFeedback
);

// 🧹 Clear all TrichBot messages for the current user
router.delete(
    "/history",
    authentication({ required: true }),
    clearMessages
);

export default router;
