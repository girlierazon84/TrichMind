// server/src/controllers/journalController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import { loggerService, journalService } from "../services";
import {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQuery,
} from "../schemas";


/**----------------------------------------------------------------------
📝 Create a new journal entry
This endpoint allows authenticated users to create a new journal entry.
-------------------------------------------------------------------------**/
export const createJournal = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Validate and parse request body
    const data = JournalCreateDTO.parse(req.body);
    // Create journal entry
    const entry = await journalService.create(userId, data);

    // Log the creation event
    await loggerService.logInfo("Journal entry created", { userId, entryId: entry._id });
    res.status(201).json({ ok: true, entry });
});

/**----------------------------------------------------------------------------
📋 List all journal entries for the authenticated user
This endpoint retrieves a list of journal entries for the authenticated user.
-------------------------------------------------------------------------------**/
export const listJournals = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from auth middleware
    const userId = req.auth?.userId!;
    // Validate and parse query parameters
    const query = JournalListQuery.parse(req.query);
    // Fetch journal entries from service
    const entries = await journalService.list(userId, query);

    // Log the retrieval event
    await loggerService.logInfo("Fetched journal entries", { userId, count: entries.length });
    res.json({ ok: true, count: entries.length, entries });
});

/**------------------------------------------------------------------------
✏️ Update a journal entry
This endpoint allows users to update an existing journal entry by its ID.
---------------------------------------------------------------------------**/
export const updateJournal = asyncHandler(async (req: Request, res: Response) => {
    // Extract journal entry ID from URL parameters
    const { id } = req.params;
    // Validate and parse request body
    const data = JournalUpdateDTO.parse(req.body);
    // Update journal entry
    const updated = await journalService.update(id, data);

    // If entry not found, log and return 404
    if (!updated) {
        await loggerService.log("Journal entry not found", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Entry not found" });
    }

    // Log the update event
    await loggerService.logInfo("Journal entry updated", { id });
    res.json({ ok: true, updated });
});
