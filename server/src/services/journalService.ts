// server/src/services/journalService.ts

import { JournalEntry } from "../models/JournalEntry";
import { JournalCreateDTO, JournalUpdateDTO, JournalListQuery } from "../schemas/journalSchema";

export const journalService = {
    async create(userId: string, data: JournalCreateDTO) {
        return await JournalEntry.create({ ...data, userId });
    },

    async list(userId: string, query: JournalListQuery) {
        const skip = (query.page - 1) * query.limit;
        return await JournalEntry.find({ userId }).sort(query.sort).skip(skip).limit(query.limit);
    },

    async update(id: string, data: JournalUpdateDTO) {
        return await JournalEntry.findByIdAndUpdate(id, data, { new: true });
    },
};
