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
// DTO type for creating a TriggersInsights entry
export type TriggersInsightsCreate = z.infer<typeof TriggersInsightsCreateSchema>;
// DTO type for creating a TriggersInsights entry
export type TriggersInsightsCreateDTO = TriggersInsightsCreate;

// Schema for updating TriggersInsights entries (all fields optional)
export const TriggersInsightsUpdateSchema =
    TriggersInsightsCreateSchema.partial();
// DTO type for updating a TriggersInsights entry
export type TriggersInsightsUpdate = z.infer<typeof TriggersInsightsUpdateSchema>;
// DTO type for updating a TriggersInsights entry
export type TriggersInsightsUpdateDTO = TriggersInsightsUpdate;

// Schema for querying TriggersInsights entries with pagination and filtering
export const TriggersInsightsListQuerySchema = z.object({
    userId: z.string().optional(), // reserved for admin tooling
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    sort: z.string().default("-frequency"),
});
// DTO type for listing TriggersInsights entries
export type TriggersInsightsListQuery = z.infer<
    typeof TriggersInsightsListQuerySchema
>;

export default {
    TriggersInsightsCreateSchema,
    TriggersInsightsUpdateSchema,
    TriggersInsightsListQuerySchema,
};
