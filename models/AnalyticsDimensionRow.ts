import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import {
  ANALYTICS_DIMENSION_TYPES,
  ANALYTICS_SOURCES,
} from "@/lib/integrations/constants";

const analyticsDimensionRowSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    date: { type: String, required: true, trim: true },
    source: { type: String, enum: [...ANALYTICS_SOURCES], required: true },
    dimensionType: { type: String, enum: [...ANALYTICS_DIMENSION_TYPES], required: true },
    dimensionValue: { type: String, required: true, trim: true },
    // Shared / GSC
    clicks: { type: Number, default: null },
    impressions: { type: Number, default: null },
    ctr: { type: Number, default: null },
    position: { type: Number, default: null },
    // GA4
    sessions: { type: Number, default: null },
    totalUsers: { type: Number, default: null },
    // GA4 events
    eventCount: { type: Number, default: null },
  },
  { timestamps: true },
);

analyticsDimensionRowSchema.index({
  projectId: 1,
  source: 1,
  dimensionType: 1,
  date: 1,
});
analyticsDimensionRowSchema.index(
  {
    projectId: 1,
    date: 1,
    source: 1,
    dimensionType: 1,
    dimensionValue: 1,
  },
  { unique: true },
);

export type AnalyticsDimensionRowDocument = InferSchemaType<typeof analyticsDimensionRowSchema> &
  mongoose.Document & {
    projectId: Types.ObjectId;
    date: string;
    source: (typeof ANALYTICS_SOURCES)[number];
    dimensionType: (typeof ANALYTICS_DIMENSION_TYPES)[number];
    dimensionValue: string;
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
    sessions: number | null;
    totalUsers: number | null;
  };

export const AnalyticsDimensionRow: Model<AnalyticsDimensionRowDocument> =
  mongoose.models.AnalyticsDimensionRow ??
  mongoose.model<AnalyticsDimensionRowDocument>(
    "AnalyticsDimensionRow",
    analyticsDimensionRowSchema,
  );
