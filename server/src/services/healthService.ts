// server/src/services/healthService.ts

import { HealthLog } from "../models";
import { HealthListQuery } from "../schemas";
import { loggerService } from "./loggerService";


/**--------------------------------------------------------
Health Service
Handles creation, retrieval, and updating of health logs.
-----------------------------------------------------------**/
export const healthService = {
    // Create a new health log
    async createHealthLog(userId: string, data: any) {
        try {
            // Create health log entry in DB
            const log = await HealthLog.create({ userId, ...data });
            await loggerService.logInfo("Health log created", { userId, logId: log._id });
            return log;
        } catch (err: any) {
            // Log error if creation fails
            await loggerService.logError("Failed to create health log", { userId, error: err.message });
            throw err;
        }
    },

    // Fetch paginated health logs
    async getHealthLogs(userId: string, query: HealthListQuery) {
        // Calculate pagination and sorting
        const skip = (query.page - 1) * query.limit;
        // Determine sort field and order
        const sortField = query.sort.startsWith("-") ? query.sort.substring(1) : query.sort;
        // Default to ascending order
        const sortOrder = query.sort.startsWith("-") ? -1 : 1;

        // Build filters
        const filters: any = { userId };
        if (query.from || query.to) {
            filters.date = {};
            if (query.from) filters.date.$gte = query.from;
            if (query.to) filters.date.$lte = query.to;
        }

        // Query health logs with filters, sorting, and pagination
        const logs = await HealthLog.find(filters)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(query.limit)
            .lean();

        return logs;
    },

    // Update a health log by ID
    async updateHealthLog(id: string, data: any) {
        try {
            return await HealthLog.findByIdAndUpdate(id, data, { new: true });
        } catch (err: any) {
            await loggerService.logError("Failed to update health log", { id, error: err.message });
            throw err;
        }
    },
};
