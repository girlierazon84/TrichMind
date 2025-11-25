// server/src/services/healthService.ts

import { HealthLog } from "../models";
import type { HealthListQuery } from "../schemas";
import { loggerService } from "./loggerService";

/**----------------------------------------------------------
    Health Service
    Handles creation, retrieval, and updating of health logs.
-------------------------------------------------------------**/
export const healthService = {
    // Create a new health log
    async createHealthLog(userId: string, data: Record<string, unknown>) {
        try {
            const log = await HealthLog.create({ userId, ...data });
            await loggerService.logInfo("Health log created", {
                userId,
                logId: log._id,
            });
            return log;
        } catch (err: any) {
            await loggerService.logError("Failed to create health log", {
                userId,
                error: err.message,
            });
            throw err;
        }
    },

    // Fetch paginated health logs
    async getHealthLogs(userId: string, query: HealthListQuery) {
        // Be defensive: query may be raw (strings) if controller still uses req.query
        const rawPage = (query as any)?.page ?? 1;
        const rawLimit = (query as any)?.limit ?? 20;
        const rawSort = (query as any)?.sort ?? "-createdAt";

        const page = Number(rawPage) > 0 ? Number(rawPage) : 1;
        const limit = Number(rawLimit) > 0 ? Number(rawLimit) : 20;

        // Safely handle sort even if missing
        const sortStr = typeof rawSort === "string" && rawSort.length > 0
            ? rawSort
            : "-createdAt";

        const sortField = sortStr.startsWith("-")
            ? sortStr.substring(1)
            : sortStr;
        const sortOrder = sortStr.startsWith("-") ? -1 : 1;

        const skip = (page - 1) * limit;

        // Build filters
        const filters: Record<string, unknown> = { userId };

        // from / to may be strings or undefined; only add if present
        if ((query as any).from || (query as any).to) {
            const from = (query as any).from;
            const to = (query as any).to;

            filters.date = {};
            if (from) (filters.date as any).$gte = from;
            if (to) (filters.date as any).$lte = to;
        }

        const logs = await HealthLog.find(filters)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();

        // Keep return shape as before (array of logs)
        return logs;
    },

    // Update a health log by ID
    async updateHealthLog(id: string, data: Record<string, unknown>) {
        try {
            return await HealthLog.findByIdAndUpdate(id, data, { new: true });
        } catch (err: any) {
            await loggerService.logError("Failed to update health log", {
                id,
                error: err.message,
            });
            throw err;
        }
    },
};

export default healthService;
