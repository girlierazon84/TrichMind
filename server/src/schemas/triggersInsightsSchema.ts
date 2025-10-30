// server/src/schemas/triggersInsightsSchema.ts

import { z } from "zod";

/**
 * ⚡ Trigger schema
 * Used for identifying behavioral or environmental triggers.
 */
export const TriggersInsightsCreateDTO = z.object({
    userId: z.string().min(1),
    name: z.string().min(1).trim(),
    frequency: z.number().min(0).default(0),
});
export type TriggersInsightsCreateDTO = z.infer<typeof TriggersInsightsCreateDTO>;

export const TriggersInsightsUpdateDTO = TriggersInsightsCreateDTO.partial();
export type TriggersInsightsUpdateDTO = z.infer<typeof TriggersInsightsUpdateDTO>;

export const TriggersInsightsListQuery = z.object({
    userId: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.string().default("-frequency"),
});
export type TriggersInsightsListQuery = z.infer<typeof TriggersInsightsListQuery>;
