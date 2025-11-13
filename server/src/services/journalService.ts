// server/src/services/journalService.ts

import { JournalEntry } from "../models";
import {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQuery
} from "../schemas";


/**------------------------------------------------------------
Journal Service
Handles creation, retrieval, and updating of journal entries.
---------------------------------------------------------------**/
export const journalService = {
    // Create a new journal entry
    async create(userId: string, data: JournalCreateDTO) {
        return await JournalEntry.create({ ...data, userId });
    },

    // List journal entries with pagination
    async list(userId: string, query: JournalListQuery) {
        // Calculate pagination
        const skip = (query.page - 1) * query.limit;
        return await JournalEntry.find({ userId }).sort(query.sort).skip(skip).limit(query.limit);
    },

    // Update a journal entry by ID
    async update(id: string, data: JournalUpdateDTO) {
        return await JournalEntry.findByIdAndUpdate(id, data, { new: true });
    },
};
