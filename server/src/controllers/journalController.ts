// server/src/controllers/journalController.ts

import type { Request, Response } from "express";
import { asyncHandler } from "../utils";
import {
    loggerService,
    journalService
} from "../services";
import type {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQueryDTO
} from "../schemas";


// fire-and-forget logger
type JournalCategory = Parameters<typeof loggerService.logInfo>[2];

function safeLogInfo(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: JournalCategory = "journal"
) {
    try {
        void loggerService.logInfo(message, context, category, userId);
    } catch { }
}

function safeLogWarn(
    message: string,
    context: Record<string, unknown> = {},
    userId?: string,
    category: JournalCategory = "journal"
) {
    try {
        void loggerService.logWarning(message, context, category, userId);
    } catch { }
}

/**-----------------------------------
    📝 Create a new journal entry
--------------------------------------*/
export const createJournal = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const data = req.body as JournalCreateDTO;
    const entry = await journalService.create(userId, data);

    safeLogInfo("Journal entry created", { userId, entryId: (entry as any)?._id }, userId);
    res.status(201).json({ ok: true, entry });
});

/**--------------------------------------------------------
    📋 List journal entries for the authenticated user
-----------------------------------------------------------*/
export const listJournals = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const query = req.query as unknown as JournalListQueryDTO;
    const entries = await journalService.list(userId, query);

    safeLogInfo("Fetched journal entries", { userId, count: entries.length }, userId);
    res.json({ ok: true, count: entries.length, entries });
});

/**-------------------------------
    ✏️ Update a journal entry
----------------------------------*/
export const updateJournal = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });

    const { id } = req.params;
    const data = req.body as JournalUpdateDTO;

    const updated = await journalService.update(id, data);
    if (!updated) {
        safeLogWarn("Journal entry not found", { userId, id }, userId);
        return res.status(404).json({ ok: false, error: "NotFound", message: "Entry not found" });
    }

    safeLogInfo("Journal entry updated", { userId, id }, userId);
    res.json({ ok: true, updated });
});

export default {
    createJournal,
    listJournals,
    updateJournal,
};
