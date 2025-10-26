// server/src/routes/trichBotRoutes.ts
import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import { createMessage, listMessages } from "../controllers/trichBotController";
import {
    TrichBotCreateDTO,
    TrichBotListQuery,
} from "../schemas/trichBotSchema";

const router = Router();

router.post("/", authentication(), validate(TrichBotCreateDTO), createMessage);
router.get("/", authentication(), validate(TrichBotListQuery, "query"), listMessages);

export default router;
