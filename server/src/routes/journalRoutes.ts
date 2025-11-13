// server/src/routes/journalRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createJournal,
    listJournals,
    updateJournal,
} from "../controllers";
import {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQuery,
} from "../schemas";


// Initialize Router
const router = Router();

// Journal Routes
router.post("/", authentication(), validate(JournalCreateDTO), createJournal);
router.get("/", authentication(), validate(JournalListQuery, "query"), listJournals);
router.put("/:id", authentication(), validate(JournalUpdateDTO), updateJournal);

export default router;
