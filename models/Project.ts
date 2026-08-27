import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import { PROJECT_STATUSES, SEO_GOALS } from "@/lib/projects/constants";

const projectSchema = new Schema(
  {
    // --- Required (Module 2) ---
    businessName: { type: String, required: true, trim: true },
    websiteUrl: { type: String, required: true, trim: true },

    // --- Optional business information ---
    businessAddress: { type: String, default: null, trim: true },
    /** Company logo — R2 private object path stored as `blob:{pathname}`. */
    logoImage: { type: String, default: null, trim: true },
    /** Stored as string to preserve country codes and formatting. */
    pocContactNumber: { type: String, default: null, trim: true },
    /** Set from the creator's user email on create; not user-editable in onboarding UI. */
    pocEmail: { type: String, default: null, trim: true, lowercase: true },

    // --- Optional business details ---
    servicesOffered: { type: [String], default: [] },
    primaryServiceToPromote: { type: String, default: null, trim: true },
    idealCustomerProfile: { type: String, default: null, trim: true },
    targetLocations: { type: [String], default: [] },

    // --- Business goals (multi-select enum) ---
    seoGoals: {
      type: [String],
      enum: [...SEO_GOALS],
      default: [],
    },

    // --- Competitors (URLs or names) ---
    competitorUrls: { type: [String], default: [] },

    // --- Workflow ---
    status: { type: String, enum: PROJECT_STATUSES, required: true, default: "pending" },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedAt: { type: Date, default: null },
    approvedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, createdAt: -1 });
projectSchema.index({ createdByUserId: 1 });
/** At most one pending project per creator — backs the application-level cap under concurrent POSTs. */
projectSchema.index(
  { createdByUserId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" }, name: "uniq_createdBy_pending" },
);

export type ProjectDocument = InferSchemaType<typeof projectSchema> &
  mongoose.Document & {
    businessName: string;
    websiteUrl: string;
    businessAddress: string | null;
    logoImage: string | null;
    pocContactNumber: string | null;
    pocEmail: string | null;
    servicesOffered: string[];
    primaryServiceToPromote: string | null;
    idealCustomerProfile: string | null;
    targetLocations: string[];
    seoGoals: (typeof SEO_GOALS)[number][];
    competitorUrls: string[];
    status: (typeof PROJECT_STATUSES)[number];
    createdByUserId: Types.ObjectId;
    approvedAt: Date | null;
    approvedByUserId: Types.ObjectId | null;
    rejectedAt: Date | null;
    rejectedByUserId: Types.ObjectId | null;
  };

const PROJECT_MODEL_NAME = "Project";

/** Next.js dev hot reload keeps the first registered schema — refresh when this module reloads. */
if (mongoose.models[PROJECT_MODEL_NAME]) {
  mongoose.deleteModel(PROJECT_MODEL_NAME);
}

export const Project: Model<ProjectDocument> = mongoose.model<ProjectDocument>(
  PROJECT_MODEL_NAME,
  projectSchema,
);
