// server/src/schemas/triggersInsightsSchema.ts

import { z } from "zod";

/**
 * ⚡ Trigger schema
 * Used for identifying behavioral or environmental triggers.
 */
export const TriggerCreateDTO = z.object({
    userId: z.string().min(1),
    name: z.string().min(1).trim(),
    frequency: z.number().min(0).default(0),
});
export type TriggerCreateDTO = z.infer<typeof TriggerCreateDTO>;

export const TriggerUpdateDTO = TriggerCreateDTO.partial();
export type TriggerUpdateDTO = z.infer<typeof TriggerUpdateDTO>;

export const TriggerListQuery = z.object({
    userId: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.string().default("-frequency"),
});
export type TriggerListQuery = z.infer<typeof TriggerListQuery>;
