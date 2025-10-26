// server/src/controllers/botController.ts
import { Request, Response } from "express";
import TrichBotMessage from "../models/TrichBot";
import { TrichBotCreateDTO, TrichBotListQuery } from "../schemas/trichBotSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const createMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = TrichBotCreateDTO.parse({ ...req.body, userId });
    const message = await TrichBotMessage.create(data);
    res.status(201).json({ ok: true, message });
});

export const listMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = TrichBotListQuery.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const messages = await TrichBotMessage.find({ userId })
        .sort(query.sort)
        .skip(skip)
        .limit(query.limit);

    res.json({ ok: true, count: messages.length, messages });
});
