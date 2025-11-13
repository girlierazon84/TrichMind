// server/src/services/triggersInsightsService.ts

import { Trigger } from "../models";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas";
import { loggerService } from "./loggerService";


/**-------------------------------------------------------
💡 Triggers Insights Service
Handles trigger insight creation, listing, and updating.
----------------------------------------------------------**/
export const triggersInsightsService = {
    // ➕ Create a new trigger insight
    async create(userId: string, data: TriggersInsightsCreateDTO) {
        // Create and save the new trigger insight
        try {
            // Create the trigger insight
            const trigger = await Trigger.create({ ...data, userId });
            await loggerService.logInfo("Triggers & Insights created!", {
                userId,
                triggerId: trigger._id,
                name: trigger.name,
            });
            // Return the created trigger insight
            return trigger;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to create triggers & insights!", {
                userId,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to create triggers & insights!");
        }
    },

    // 📋 List trigger insights (supports pagination & search)
    async list(userId: string, query: TriggersInsightsListQuery) {
        // Calculate pagination parameters and build search filter
        try {
            // Calculate pagination parameters
            const skip = (query.page - 1) * query.limit;
            // Build the search filter
            const filter: Record<string, any> = { userId };

            // Add search by name if provided
            if (query.search) filter.name = { $regex: query.search, $options: "i" };

            // Fetch triggers from the database
            const triggers = await Trigger.find(filter)
                .sort(query.sort)
                .skip(skip)
                .limit(query.limit);

            // Log the fetched triggers
            await loggerService.logInfo("Fetched triggers & insights!", {
                userId,
                count: triggers.length,
                search: query.search || null,
            });

            // Return the fetched triggers
            return triggers;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to list triggers & insights!", {
                userId,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to fetch triggers & insights!");
        }
    },

    // ✏️ Update an existing trigger insight
    async update(id: string, data: TriggersInsightsUpdateDTO) {
        // Validate input data
        try {
            // Update the trigger insight in the database
            const updated = await Trigger.findByIdAndUpdate(id, data, { new: true });

            // Log if the trigger insight was not found
            if (!updated) {
                await loggerService.log("Triggers & Insights not found!", "warning", "system", { id });
                return null;
            }

            // Log the successful update
            await loggerService.logInfo("Triggers & Insights updated!", {
                triggerId: id,
                updatedFields: Object.keys(data),
            });

            // Return the updated trigger insight
            return updated;
        } catch (err: any) {
            // Log the error and rethrow
            await loggerService.logError("Failed to update triggers & insights!", {
                triggerId: id,
                error: err.message,
            });
            // Rethrow a generic error
            throw new Error("Failed to update triggers & insights!");
        }
    },
};
