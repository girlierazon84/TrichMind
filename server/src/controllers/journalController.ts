// server/src/controllers/journalController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { journalService } from "../services/journalService";
import {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQuery,
} from "../schemas/journalSchema";
import { loggerService } from "../services/loggerService";

/**
 * 📝 Create a new journal entry
 */
export const createJournal = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = JournalCreateDTO.parse(req.body);
    const entry = await journalService.create(userId, data);

    await loggerService.logInfo("Journal entry created", { userId, entryId: entry._id });
    res.status(201).json({ ok: true, entry });
});

/**
 * 📋 List all journal entries for the authenticated user
 */
export const listJournals = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = JournalListQuery.parse(req.query);
    const entries = await journalService.list(userId, query);

    await loggerService.logInfo("Fetched journal entries", { userId, count: entries.length });
    res.json({ ok: true, count: entries.length, entries });
});

/**
 * ✏️ Update a journal entry
 */
export const updateJournal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = JournalUpdateDTO.parse(req.body);
    const updated = await journalService.update(id, data);

    if (!updated) {
        await loggerService.log("Journal entry not found", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Entry not found" });
    }

    await loggerService.logInfo("Journal entry updated", { id });
    res.json({ ok: true, updated });
});
