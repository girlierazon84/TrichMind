// server/src/services/healthService.ts

import { HealthLog } from "../models";
import { loggerService } from "./loggerService";

export const healthService = {
    async createHealthLog(userId: string, data: any) {
        try {
            const log = await HealthLog.create({ userId, ...data });
            await loggerService.logInfo("Health log created", { userId, logId: log._id });
            return log;
        } catch (err: any) {
            await loggerService.logError("Failed to create health log", { error: err.message });
            throw err;
        }
    },

    async getHealthLogs(userId: string, limit = 30) {
        return HealthLog.find({ userId })
            .sort({ date: -1 })
            .limit(limit)
            .lean();
    },
};
