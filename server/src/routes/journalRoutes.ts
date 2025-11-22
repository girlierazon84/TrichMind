// server/src/routes/journalRoutes.ts

import { Router } from "express";
import { validate, authentication } from "../middlewares";
import {
    createJournal,
    listJournals,
    updateJournal,
} from "../controllers";
import {
    JournalCreateSchema,
    JournalUpdateSchema,
    JournalListQuerySchema,
} from "../schemas";

// Initialize Router
const router = Router();

// Journal Routes
router.post(
    "/",
    authentication(),
    validate(JournalCreateSchema),
    createJournal
);
router.get(
    "/",
    authentication(),
    validate(JournalListQuerySchema, "query"),
    listJournals
);
router.put(
    "/:id",
    authentication(),
    validate(JournalUpdateSchema),
    updateJournal
);

export default router;
