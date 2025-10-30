// server/src/controllers/triggersController.ts
import { Request, Response } from "express";
import { Trigger } from "../models/TriggersInsights";
import { TriggerCreateDTO, TriggerUpdateDTO, TriggerListQuery } from "../schemas/triggersInsightsSchema";
import { asyncHandler } from "../utils/asyncHandler";

export const createTrigger = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = TriggerCreateDTO.parse({ ...req.body, userId });
    const trigger = await Trigger.create(data);
    res.status(201).json({ ok: true, trigger });
});

export const listTriggers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = TriggerListQuery.parse(req.query);
    const skip = (query.page - 1) * query.limit;

    const filter: any = { userId };
    if (query.search) filter.name = { $regex: query.search, $options: "i" };

    const triggers = await Trigger.find(filter)
        .sort(query.sort)
        .skip(skip)
        .limit(query.limit);

    res.json({ ok: true, count: triggers.length, triggers });
});

export const updateTrigger = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = TriggerUpdateDTO.parse(req.body);
    const updated = await Trigger.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Trigger not found" });
    res.json({ ok: true, updated });
});
