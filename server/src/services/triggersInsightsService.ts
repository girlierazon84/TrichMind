// server/src/services/triggersInsightsService.ts

import { TriggerInsight } from "../models";
import type {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQueryDTO, // ✅ correct name
} from "../schemas";

import { loggerService } from "./loggerService";
import type { ILogEvent } from "../models";


/**---------------------------------------------------------------------
    ✅ Sort whitelist to avoid sorting on arbitrary/unindexed fields
------------------------------------------------------------------------*/
type SortField = "frequency" | "name" | "createdAt" | "updatedAt";
type SortDir = 1 | -1;

// Whitelisted fields only
const SORT_FIELDS = new Set<SortField>(["frequency", "name", "createdAt", "updatedAt"]);

// Parse sort string into mongoose sort object
function parseSort(sort?: string): Record<string, SortDir> {
    // Default sort
    const raw = typeof sort === "string" && sort.trim() ? sort.trim() : "-frequency";
    const desc = raw.startsWith("-");
    const fieldRaw = (desc ? raw.slice(1) : raw) as string;

    // Validate field against whitelist
    const field: SortField = SORT_FIELDS.has(fieldRaw as SortField)
        ? (fieldRaw as SortField)
        : "frequency";

    // Return mongoose sort object
    return { [field]: desc ? -1 : 1 };
}

// Log category for trigger insights
type LogCategory = ILogEvent["category"];
const CATEGORY: LogCategory = "ui"; // ✅ valid per your LogModel.ts (auth/ml/ui/network/alert/summary/system/unknown)

/**----------------------------------
    ✅ Triggers Insights Service
-------------------------------------*/
export const triggersInsightsService = {
    // ✅ Create a new trigger insight
    async create(userId: string, data: TriggersInsightsCreateDTO) {
        // Create in DB
        const trigger = await TriggerInsight.create({ ...data, userId });

        // fire-and-forget log (never breaks flow)
        void loggerService.logInfo(
            "Trigger insight created",
            { userId, triggerId: trigger._id, name: trigger.name },
            CATEGORY,
            userId
        );

        return trigger;
    },

    // ✅ List trigger insights (pagination + optional search)
    async list(userId: string, query: TriggersInsightsListQueryDTO) {
        // Pagination params
        const page = query.page ?? 1;
        const limit = query.limit ?? 50;
        const skip = (page - 1) * limit;

        // Build filter
        const filter: Record<string, unknown> = { userId };
        if (query.search) {
            filter.name = { $regex: query.search, $options: "i" };
        }

        // Query DB
        const triggers = await TriggerInsight.find(filter)
            .sort(parseSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        // Optional: log reads (comment out if too noisy)
        void loggerService.logInfo(
            "Trigger insights fetched",
            { userId, count: triggers.length, page, limit, search: query.search, sort: query.sort },
            CATEGORY,
            userId
        );

        return triggers;
    },

    // ✅ Update existing trigger insight
    async update(id: string, data: TriggersInsightsUpdateDTO) {
        // Update in DB
        const updated = await TriggerInsight.findByIdAndUpdate(id, data, { new: true })
            .lean()
            .exec();

        // Log outcome (fire-and-forget)
        if (!updated) {
            void loggerService.logWarning(
                "Trigger insight not found",
                { id },
                CATEGORY
            );
            return null;
        }

        // Successful update log
        void loggerService.logInfo(
            "Trigger insight updated",
            { id, updatedFields: Object.keys(data ?? {}) },
            CATEGORY
        );

        return updated;
    },
};

export default triggersInsightsService;
