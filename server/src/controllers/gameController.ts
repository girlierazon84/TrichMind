// server/src/controllers/gameController.ts
import { Request, Response } from "express";
import GameSession from "../models/TrichGame";
import { GameSessionCreateDTO, GameSessionUpdateDTO, GameSessionListQuery } from "../schemas/trichGameSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const createSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = GameSessionCreateDTO.parse({ ...req.body, userId });
    const session = await GameSession.create(data);
    res.status(201).json({ ok: true, session });
});

export const listSessions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = GameSessionListQuery.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const sessions = await GameSession.find({ userId })
        .sort(query.sort)
        .skip(skip)
        .limit(query.limit);

    res.json({ ok: true, count: sessions.length, sessions });
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = GameSessionUpdateDTO.parse(req.body);
    const updated = await GameSession.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Session not found" });
    res.json({ ok: true, updated });
});
