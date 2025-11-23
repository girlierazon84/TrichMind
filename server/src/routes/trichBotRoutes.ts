// server/src/routes/trichBotRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createMessage,
    listMessages,
    updateMessageFeedback,
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

export default router;
