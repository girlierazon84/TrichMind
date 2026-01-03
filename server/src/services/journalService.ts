// server/src/services/journalService.ts

import { JournalEntry } from "../models";
import type {
    JournalCreateDTO,
    JournalUpdateDTO,
    JournalListQueryDTO
} from "../schemas";


// Utility to parse sort string into mongoose sort object
function parseSort(sort?: string) {
    // Default sort by createdAt descending
    const s = typeof sort === "string" && sort.trim().length ? sort.trim() : "-createdAt";
    const desc = s.startsWith("-");
    const field = desc ? s.slice(1) : s;
    return { [field]: desc ? -1 : 1 } as Record<string, 1 | -1>;
}

/**---------------------
    Journal Service
------------------------*/
export const journalService = {
    // Create a new journal entry
    async create(userId: string, data: JournalCreateDTO) {
        return JournalEntry.create({ ...data, userId });
    },

    // List journal entries with pagination and sorting
    async list(userId: string, query: JournalListQueryDTO) {
        // Set default pagination values
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        const skip = (page - 1) * limit;

        // Fetch entries from the database
        return JournalEntry.find({ userId })
            .sort(parseSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();
    },

    // Update an existing journal entry
    async update(id: string, data: JournalUpdateDTO) {
        return JournalEntry.findByIdAndUpdate(id, data, { new: true }).lean().exec();
    },
};

export default journalService;
