// server/src/services/gameService.ts

import { GameSession } from "../models/TrichGame";
import { GameSessionCreateDTO, GameSessionUpdateDTO, GameSessionListQuery } from "../schemas/trichGameSchema";

export const gameService = {
    async createSession(userId: string, data: GameSessionCreateDTO) {
        return await GameSession.create({ ...data, userId });
    },

    async listSessions(userId: string, query: GameSessionListQuery) {
        const skip = (query.page - 1) * query.limit;
        return await GameSession.find({ userId }).sort(query.sort).skip(skip).limit(query.limit);
    },

    async updateSession(id: string, data: GameSessionUpdateDTO) {
        return await GameSession.findByIdAndUpdate(id, data, { new: true });
    },
};
