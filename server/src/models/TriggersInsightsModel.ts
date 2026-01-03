// server/src/models/TriggersInsightsModel.ts

import mongoose, {
    Schema,
    type Types,
    type HydratedDocument
} from "mongoose";


/**-------------------------------
    ⚡ Trigger Insights Model
----------------------------------*/
export interface ITriggerInsight {
    userId: Types.ObjectId;
    name: string;
    frequency: number;
}

// Mongoose Document type
export type TriggerInsightDocument = HydratedDocument<ITriggerInsight>;

// Mongoose Schema
const TriggerInsightSchema = new Schema<ITriggerInsight>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            index: true,
            required: true,
        },
        name: { type: String, required: true, trim: true },
        frequency: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

// Efficient sorting by frequency + lookup by name
TriggerInsightSchema.index({ userId: 1, frequency: -1 });
TriggerInsightSchema.index({ userId: 1, name: 1 });

// Mongoose Model
export const TriggerInsight =
    (mongoose.models.TriggerInsight as mongoose.Model<ITriggerInsight>) ||
    mongoose.model<ITriggerInsight>("TriggerInsight", TriggerInsightSchema);

export default TriggerInsight;
