// server/src/services/trichBotService.ts

import { TrichBotMessage } from "../models/TrichBot";
import { TrichBotCreateDTO, TrichBotListQuery } from "../schemas/trichBotSchema";

export const botService = {
    async createMessage(userId: string, data: TrichBotCreateDTO) {
        return await TrichBotMessage.create({ ...data, userId });
    },

    async listMessages(userId: string, query: TrichBotListQuery) {
        const skip = (query.page - 1) * query.limit;
        return await TrichBotMessage.find({ userId }).sort(query.sort).skip(skip).limit(query.limit);
    },
};
