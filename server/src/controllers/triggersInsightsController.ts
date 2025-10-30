// server/src/controllers/triggersInsightsController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { triggersInsightsService } from "../services/triggersInsightsService";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas/triggersInsightsSchema";
import { loggerService } from "../services/loggerService";

/**
 * ➕ Create a new trigger insight entry
 */
export const createTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const data = TriggersInsightsCreateDTO.parse(req.body);

    const trigger = await triggersInsightsService.create(userId, data);

    await loggerService.logInfo("Triggers & Insights created!", {
        userId,
        triggerId: trigger._id,
        name: trigger.name,
    });

    res.status(201).json({ ok: true, trigger });
});

/**
 * 📋 List all trigger insights for a user (with pagination & search)
 */
export const listTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.auth?.userId!;
    const query = TriggersInsightsListQuery.parse(req.query);

    const triggers = await triggersInsightsService.list(userId, query);

    await loggerService.logInfo("Fetched triggers & insights!", {
        userId,
        count: triggers.length,
        search: query.search,
    });

    res.status(200).json({ ok: true, count: triggers.length, triggers });
});

/**
 * ✏️ Update an existing trigger insight
 */
export const updateTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = TriggersInsightsUpdateDTO.parse(req.body);

    const updated = await triggersInsightsService.update(id, data);

    if (!updated) {
        await loggerService.log("Triggers & Insights not found!", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Triggers & Insights not found!" });
    }

    await loggerService.logInfo("Triggers & Insights updated!", { id });
    res.status(200).json({ ok: true, updated });
});
