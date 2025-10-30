// server/src/services/triggersInsightsService.ts

import { Trigger } from "../models/TriggersInsights";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas/triggersInsightsSchema";
import { loggerService } from "./loggerService";

/**
 * 💡 Triggers Insights Service
 * Handles trigger insight creation, listing, and updating.
 */
export const triggersInsightsService = {
    /**
     * ➕ Create a new trigger insight
     */
    async create(userId: string, data: TriggersInsightsCreateDTO) {
        try {
            const trigger = await Trigger.create({ ...data, userId });
            await loggerService.logInfo("Triggers & Insights created!", {
                userId,
                triggerId: trigger._id,
                name: trigger.name,
            });
            return trigger;
        } catch (err: any) {
            await loggerService.logError("Failed to create triggers & insights!", {
                userId,
                error: err.message,
            });
            throw new Error("Failed to create triggers & insights!");
        }
    },

    /**
     * 📋 List trigger insights (supports pagination & search)
     */
    async list(userId: string, query: TriggersInsightsListQuery) {
        try {
            const skip = (query.page - 1) * query.limit;
            const filter: Record<string, any> = { userId };

            if (query.search) filter.name = { $regex: query.search, $options: "i" };

            const triggers = await Trigger.find(filter)
                .sort(query.sort)
                .skip(skip)
                .limit(query.limit);

            await loggerService.logInfo("Fetched triggers & insights!", {
                userId,
                count: triggers.length,
                search: query.search || null,
            });

            return triggers;
        } catch (err: any) {
            await loggerService.logError("Failed to list triggers & insights!", {
                userId,
                error: err.message,
            });
            throw new Error("Failed to fetch triggers & insights!");
        }
    },

    /**
     * ✏️ Update an existing trigger insight
     */
    async update(id: string, data: TriggersInsightsUpdateDTO) {
        try {
            const updated = await Trigger.findByIdAndUpdate(id, data, { new: true });

            if (!updated) {
                await loggerService.log("Triggers & Insights not found!", "warning", "system", { id });
                return null;
            }

            await loggerService.logInfo("Triggers & Insights updated!", {
                triggerId: id,
                updatedFields: Object.keys(data),
            });

            return updated;
        } catch (err: any) {
            await loggerService.logError("Failed to update triggers & insights!", {
                triggerId: id,
                error: err.message,
            });
            throw new Error("Failed to update triggers & insights!");
        }
    },
};
