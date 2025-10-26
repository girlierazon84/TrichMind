// server/src/controllers/journalController.ts
import { Request, Response } from "express";
import JournalEntry from "../models/JournalEntry";
import { JournalCreateDTO, JournalUpdateDTO, JournalListQuery } from "../schemas/journalSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const createJournal = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = JournalCreateDTO.parse({ ...req.body, userId });
    const entry = await JournalEntry.create(data);
    res.status(201).json({ ok: true, entry });
});

export const listJournals = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = JournalListQuery.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const entries = await JournalEntry.find({ userId })
        .sort(query.sort)
        .skip(skip)
        .limit(query.limit);

    res.json({ ok: true, count: entries.length, entries });
});

export const updateJournal = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = JournalUpdateDTO.parse(req.body);
    const updated = await JournalEntry.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Entry not found" });
    res.json({ ok: true, updated });
});
