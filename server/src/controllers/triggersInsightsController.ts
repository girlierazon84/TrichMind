// server/src/controllers/triggersInsightsController.ts

import { Request, Response } from "express";
import { asyncHandler } from "../utils";
import {
    loggerService,
    triggersInsightsService
} from "../services";
import {
    TriggersInsightsCreateDTO,
    TriggersInsightsUpdateDTO,
    TriggersInsightsListQuery,
} from "../schemas";


/**--------------------------------------------------------------------------------------------------------------
➕ Create a new trigger insight entry
This endpoint allows a user to create a new trigger insight by providing necessary details in the request body.
-----------------------------------------------------------------------------------------------------------------**/
export const createTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from authenticated request
    const userId = req.auth?.userId!;
    // Validate and parse request body
    const data = TriggersInsightsCreateDTO.parse(req.body);

    // Create a new trigger insight entry
    const trigger = await triggersInsightsService.create(userId, data);

    // Log the creation of the new trigger insight
    await loggerService.logInfo("Triggers & Insights created!", {
        userId,
        triggerId: trigger._id,
        name: trigger.name,
    });

    // Respond with the created trigger insight
    res.status(201).json({ ok: true, trigger });
});

/**-----------------------------------------------------------------
📋 List all trigger insights for a user (with pagination & search)
--------------------------------------------------------------------**/
export const listTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    // Extract user ID from authenticated request
    const userId = req.auth?.userId!;
    // Validate and parse query parameters
    const query = TriggersInsightsListQuery.parse(req.query);

    // Fetch trigger insights for the user based on query parameters
    const triggers = await triggersInsightsService.list(userId, query);

    // Log the retrieval of triggers insights
    await loggerService.logInfo("Fetched triggers & insights!", {
        userId,
        count: triggers.length,
        search: query.search,
    });

    // Respond with the list of trigger insights
    res.status(200).json({ ok: true, count: triggers.length, triggers });
});

/**------------------------------------
✏️ Update an existing trigger insight
---------------------------------------**/
export const updateTriggersInsights = asyncHandler(async (req: Request, res: Response) => {
    // Extract trigger insight ID from request parameters
    const { id } = req.params;
    // Validate and parse request body
    const data = TriggersInsightsUpdateDTO.parse(req.body);

    // Update the trigger insight entry
    const updated = await triggersInsightsService.update(id, data);

    // Log the update attempt
    if (!updated) {
        await loggerService.log("Triggers & Insights not found!", "warning", "system", { id });
        return res.status(404).json({ ok: false, error: "Triggers & Insights not found!" });
    }

    // Log the successful update
    await loggerService.logInfo("Triggers & Insights updated!", { id });
    res.status(200).json({ ok: true, updated });
});
