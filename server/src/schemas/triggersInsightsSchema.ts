// server/src/schemas/triggersInsightsSchema.ts

import { z } from "zod";

/**--------------------------------------------------------------
    ⚡ Trigger schema
    Used for identifying behavioral or environmental triggers.
-----------------------------------------------------------------**/
export const TriggersInsightsCreateSchema = z.object({
    name: z.string().min(1).trim(),
    frequency: z.coerce.number().min(0).default(0),
});
export type TriggersInsightsCreate = z.infer<typeof TriggersInsightsCreateSchema>;
export type TriggersInsightsCreateDTO = TriggersInsightsCreate;

export const TriggersInsightsUpdateSchema =
    TriggersInsightsCreateSchema.partial();
export type TriggersInsightsUpdate = z.infer<typeof TriggersInsightsUpdateSchema>;
export type TriggersInsightsUpdateDTO = TriggersInsightsUpdate;

export const TriggersInsightsListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin tooling
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.string().default("-frequency"),
});
export type TriggersInsightsListQuery = z.infer<
    typeof TriggersInsightsListQuerySchema
>;
