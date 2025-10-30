// server/src/services/triggersInsightsService.ts

import { Trigger } from "../models/TriggersInsights";
import { TriggerCreateDTO, TriggerUpdateDTO, TriggerListQuery } from "../schemas/triggersInsightsSchema";

export const triggerService = {
    async create(userId: string, data: TriggerCreateDTO) {
        return await Trigger.create({ ...data, userId });
    },

    async list(userId: string, query: TriggerListQuery) {
        const skip = (query.page - 1) * query.limit;
        const filter: any = { userId };
        if (query.search) filter.name = { $regex: query.search, $options: "i" };
        return await Trigger.find(filter).sort(query.sort).skip(skip).limit(query.limit);
    },

    async update(id: string, data: TriggerUpdateDTO) {
        return await Trigger.findByIdAndUpdate(id, data, { new: true });
    },
};
