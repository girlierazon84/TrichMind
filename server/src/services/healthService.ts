// server/src/services/healthService.ts

import { HealthLog } from "../models";
import type {
    HealthCreateDTO,
    HealthUpdateDTO,
    HealthListQueryDTO,
} from "../schemas";
import { loggerService } from "./loggerService";


// Helper to parse sort parameter
function parseSort(sort?: string) {
    // Default sort by date descending
    const s = typeof sort === "string" && sort.trim().length ? sort.trim() : "-date";
    const desc = s.startsWith("-");
    const field = desc ? s.slice(1) : s;
    return { [field]: desc ? -1 : 1 } as Record<string, 1 | -1>;
}

/**-------------------
    Health Service
----------------------*/
export const healthService = {
    // Create a new health log
    async createHealthLog(userId: string, data: HealthCreateDTO) {
        // Create the health log entry
        const log = await HealthLog.create({ userId, ...data });

        // Log the creation event
        void loggerService.logInfo(
            "Health log created",
            { userId, logId: log._id },
            "system",
            userId
        );

        // Return the created log
        return log;
    },

    // Retrieve health logs with pagination and filtering
    async getHealthLogs(userId: string, query: HealthListQueryDTO) {
        // Pagination parameters
        const page = Number(query.page ?? 1) > 0 ? Number(query.page ?? 1) : 1;
        const limit = Number(query.limit ?? 20) > 0 ? Number(query.limit ?? 20) : 20;
        const skip = (page - 1) * limit;

        // Build filters
        const filters: Record<string, any> = { userId };

        // Date range filter
        if (query.from || query.to) {
            filters.date = {};
            if (query.from) filters.date.$gte = query.from;
            if (query.to) filters.date.$lte = query.to;
        }

        // Fetch logs from the database
        const logs = await HealthLog.find(filters)
            .sort(parseSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean()
            .exec();

        // Return the fetched logs
        return logs;
    },

    // Update an existing health log
    async updateHealthLog(id: string, data: HealthUpdateDTO) {
        // Update the health log entry
        const updated = await HealthLog.findByIdAndUpdate(id, data, { new: true })
            .lean()
            .exec();

        // If not found, log a warning
        if (!updated) {
            // Log the warning
            void loggerService.logWarning(
                "Health log not found for update",
                { id },
                "system"
            );
            return null;
        }

        // Log the update event
        void loggerService.logInfo("Health log updated", { id }, "system");
        return updated;
    },
};

export default healthService;
