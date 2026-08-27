import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import { CLIENT_STATUSES, DEFAULT_CLIENT_STATUS } from "@/lib/clients/constants";
import { SEO_GOALS } from "@/lib/projects/constants";

const clientSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [...CLIENT_STATUSES],
      default: DEFAULT_CLIENT_STATUS,
    },
    websiteUrl: { type: String, required: true, trim: true },
    businessAddress: { type: String, default: null, trim: true },
    /** Company logo — R2 private object path stored as `blob:{pathname}`. */
    logoImage: { type: String, default: null, trim: true },
    pocContactNumber: { type: String, default: null, trim: true },
    pocEmail: { type: String, default: null, trim: true, lowercase: true },
    servicesOffered: { type: [String], default: [] },
    primaryServiceToPromote: { type: String, default: null, trim: true },
    idealCustomerProfile: { type: String, default: null, trim: true },
    targetLocations: { type: [String], default: [] },
    seoGoals: {
      type: [String],
      enum: [...SEO_GOALS],
      default: [],
    },
    competitorUrls: { type: [String], default: [] },
    shareToken: { type: String, required: true, trim: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

clientSchema.index({ shareToken: 1 }, { unique: true });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ businessName: 1 });
clientSchema.index({ status: 1, createdAt: -1 });

export type ClientDocument = InferSchemaType<typeof clientSchema> &
  mongoose.Document & {
    businessName: string;
    status: (typeof CLIENT_STATUSES)[number];
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
    shareToken: string;
    createdByUserId: Types.ObjectId;
    updatedByUserId: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
  };

const CLIENT_MODEL_NAME = "Client";

if (mongoose.models[CLIENT_MODEL_NAME]) {
  mongoose.deleteModel(CLIENT_MODEL_NAME);
}

export const Client: Model<ClientDocument> = mongoose.model<ClientDocument>(
  CLIENT_MODEL_NAME,
  clientSchema,
);
