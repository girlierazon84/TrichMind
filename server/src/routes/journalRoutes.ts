// server/src/routes/journalRoutes.ts

import { Router } from "express";
import { authentication } from "../middlewares/authMiddleware";
import { validate } from "../middlewares/validateMiddleware";
import {
    createJournal,
    listJournals,
    updateJournal,
} from "../controllers/journalController";
import {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQuery,
} from "../schemas/journalSchema";


// Initialize Router
const router = Router();

// Journal Routes
router.post("/", authentication(), validate(JournalCreateDTO), createJournal);
router.get("/", authentication(), validate(JournalListQuery, "query"), listJournals);
router.put("/:id", authentication(), validate(JournalUpdateDTO), updateJournal);

export default router;
