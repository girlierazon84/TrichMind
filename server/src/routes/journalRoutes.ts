// server/src/routes/journalRoutes.ts

import { Router } from "express";
import {
    validate,
    authentication
} from "../middlewares";
import {
    createJournal,
    listJournals,
    updateJournal
} from "../controllers";
import {
    JournalCreateSchema,
    JournalUpdateSchema,
    JournalListQuerySchema,
} from "../schemas";


// Initialize the router
const router = Router();

/**--------------------------------------
    Define routes for journal entries
-----------------------------------------*/

// Create a new journal entry
router.post("/", authentication({ required: true }), validate(JournalCreateSchema), createJournal);

/**-------------------------
    List journal entries
----------------------------*/

// GET /api/journals
router.get(
    "/",
    authentication({ required: true }),
    validate(JournalListQuerySchema, "query"),
    listJournals
);

// Update a journal entry
router.put("/:id", authentication({ required: true }), validate(JournalUpdateSchema), updateJournal);

export default router;
