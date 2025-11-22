// server/src/services/trichBotService.ts

import { TrichBotMessage } from "../models";
import {
    TrichBotCreateDTO,
    TrichBotListQuery
} from "../schemas";

/**-----------------------------------------
    🤖 TrichBot message management service
--------------------------------------------**/
export const botService = {
    // Create a new TrichBot message
    async createMessage(userId: string, data: TrichBotCreateDTO) {
        return await TrichBotMessage.create({ ...data, userId });
    },

    // List TrichBot messages for a user with pagination
    async listMessages(userId: string, query: TrichBotListQuery) {
        // Calculate skip for pagination
        const skip = (query.page - 1) * query.limit;
        return await TrichBotMessage.find({ userId }).sort(query.sort).skip(skip).limit(query.limit);
    },
};

export default botService;
