// server/src/services/healthService.ts

import { HealthLog } from "../models";
import { HealthListQuery } from "../schemas/healthSchema";
import { loggerService } from "./loggerService";

export const healthService = {
    /**
     * Create a health log
     */
    async createHealthLog(userId: string, data: any) {
        try {
            const log = await HealthLog.create({ userId, ...data });
            await loggerService.logInfo("Health log created", { userId, logId: log._id });
            return log;
        } catch (err: any) {
            await loggerService.logError("Failed to create health log", { userId, error: err.message });
            throw err;
        }
    },

    /**
     * Fetch paginated health logs
     */
    async getHealthLogs(userId: string, query: HealthListQuery) {
        const skip = (query.page - 1) * query.limit;
        const sortField = query.sort.startsWith("-") ? query.sort.substring(1) : query.sort;
        const sortOrder = query.sort.startsWith("-") ? -1 : 1;

        const filters: any = { userId };
        if (query.from || query.to) {
            filters.date = {};
            if (query.from) filters.date.$gte = query.from;
            if (query.to) filters.date.$lte = query.to;
        }

        const logs = await HealthLog.find(filters)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(query.limit)
            .lean();

        return logs;
    },

    /**
     * Update a health log by ID
     */
    async updateHealthLog(id: string, data: any) {
        try {
            return await HealthLog.findByIdAndUpdate(id, data, { new: true });
        } catch (err: any) {
            await loggerService.logError("Failed to update health log", { id, error: err.message });
            throw err;
        }
    },
};
