// server/src/schemas/triggersInsightsSchema.ts

import { z } from "zod";


// Schema for creating a new Triggers Insight
export const TriggersInsightsCreateSchema = z
    .object({
        name: z.string().min(1).trim(),
        frequency: z.coerce.number().min(0).default(0),
    })
    .strict();

// TypeScript type for the create DTO
export type TriggersInsightsCreateDTO = z.infer<
    typeof TriggersInsightsCreateSchema
>;

// Schema for updating an existing Triggers Insight
export const TriggersInsightsUpdateSchema =
    TriggersInsightsCreateSchema.partial().strict();

// TypeScript type for the update DTO
export type TriggersInsightsUpdateDTO = z.infer<
    typeof TriggersInsightsUpdateSchema
>;

// Schema for listing Triggers Insights with query parameters
export const TriggersInsightsListQuerySchema = z
    .object({
        userId: z.string().optional(), // reserved for admin tooling
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(200).default(50),
        sort: z.string().default("-frequency"),
    })
    .strict();

// TypeScript type for the list query DTO
export type TriggersInsightsListQueryDTO = z.infer<
    typeof TriggersInsightsListQuerySchema
>;

export default {
    TriggersInsightsCreateSchema,
    TriggersInsightsUpdateSchema,
    TriggersInsightsListQuerySchema,
};
