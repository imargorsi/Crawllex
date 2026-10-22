import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import {
  GOOGLE_INTEGRATION_SERVICES,
  GOOGLE_PROVIDER,
  INTEGRATION_STATUSES,
} from "@/lib/integrations/constants";

const projectIntegrationSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    provider: { type: String, required: true, default: GOOGLE_PROVIDER, trim: true },
    service: { type: String, enum: [...GOOGLE_INTEGRATION_SERVICES], required: true },
    status: {
      type: String,
      enum: [...INTEGRATION_STATUSES],
      required: true,
      default: "disconnected",
    },
    /** GSC site URL (e.g. `https://example.com/`) or GA4 property resource (`properties/123`). */
    externalPropertyId: { type: String, default: null, trim: true },
    lastSyncedAt: { type: Date, default: null },
    // Set once the GA4 event history (90 days) has been pulled. Until then the next sync backfills it.
    eventsBackfilledAt: { type: Date, default: null },
    lastError: { type: String, default: null, trim: true },
    connectedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    connectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

projectIntegrationSchema.index({ projectId: 1, provider: 1, service: 1 }, { unique: true });
projectIntegrationSchema.index({ status: 1, service: 1 });

export type ProjectIntegrationDocument = InferSchemaType<typeof projectIntegrationSchema> &
  mongoose.Document & {
    projectId: Types.ObjectId;
    provider: string;
    service: (typeof GOOGLE_INTEGRATION_SERVICES)[number];
    status: (typeof INTEGRATION_STATUSES)[number];
    externalPropertyId: string | null;
    lastSyncedAt: Date | null;
    eventsBackfilledAt: Date | null;
    lastError: string | null;
    connectedByUserId: Types.ObjectId | null;
    connectedAt: Date | null;
  };

export const ProjectIntegration: Model<ProjectIntegrationDocument> =
  mongoose.models.ProjectIntegration ??
  mongoose.model<ProjectIntegrationDocument>("ProjectIntegration", projectIntegrationSchema);
