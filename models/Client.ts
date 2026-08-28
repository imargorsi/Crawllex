import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import { CLIENT_STATUSES, DEFAULT_CLIENT_STATUS } from "@/lib/clients/constants";
import {
  CLIENT_CONTENT_READY,
  CLIENT_EXISTING_SYSTEMS,
  CLIENT_LANGUAGES,
  CLIENT_PLATFORMS,
  CLIENT_PROJECT_TYPES,
  CLIENT_USER_ROLES,
} from "@/lib/clients/intake-constants";

const clientSchema = new Schema(
  {
    businessName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [...CLIENT_STATUSES],
      default: DEFAULT_CLIENT_STATUS,
    },
    contactPerson: { type: String, required: true, trim: true },
    pocEmail: { type: String, required: true, trim: true, lowercase: true },
    pocContactNumber: { type: String, required: true, trim: true },
    businessSummary: { type: String, required: true, trim: true },
    idealCustomerProfile: { type: String, required: true, trim: true },
    projectTypes: { type: [String], enum: [...CLIENT_PROJECT_TYPES], default: [] },
    platforms: { type: [String], enum: [...CLIENT_PLATFORMS], default: [] },
    projectName: { type: String, required: true, trim: true },
    projectDescription: { type: String, required: true, trim: true },
    successLooksLike: { type: String, required: true, trim: true },
    existingSystem: { type: String, enum: [...CLIENT_EXISTING_SYSTEMS], required: true },
    websiteUrl: { type: String, default: null, trim: true },
    changeNotes: { type: String, default: null, trim: true },
    launchMustHaves: { type: String, required: true, trim: true },
    laterFeatures: { type: String, default: null, trim: true },
    userRoles: { type: [String], enum: [...CLIENT_USER_ROLES], default: [] },
    languages: { type: [String], enum: [...CLIENT_LANGUAGES], default: [] },
    rtlRequired: { type: Boolean, default: false },
    expectedLaunchDate: { type: String, default: null, trim: true },
    hasFixedDeadline: { type: Boolean, default: false },
    contentReady: { type: String, enum: [...CLIENT_CONTENT_READY], required: true },
    requirementsConfirmed: { type: Boolean, default: false },
    /** Company logo — R2 private object path stored as `blob:{pathname}`. */
    logoImage: { type: String, default: null, trim: true },
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
    contactPerson: string;
    pocEmail: string;
    pocContactNumber: string;
    businessSummary: string;
    idealCustomerProfile: string;
    projectTypes: (typeof CLIENT_PROJECT_TYPES)[number][];
    platforms: (typeof CLIENT_PLATFORMS)[number][];
    projectName: string;
    projectDescription: string;
    successLooksLike: string;
    existingSystem: (typeof CLIENT_EXISTING_SYSTEMS)[number];
    websiteUrl: string | null;
    changeNotes: string | null;
    launchMustHaves: string;
    laterFeatures: string | null;
    userRoles: (typeof CLIENT_USER_ROLES)[number][];
    languages: (typeof CLIENT_LANGUAGES)[number][];
    rtlRequired: boolean;
    expectedLaunchDate: string | null;
    hasFixedDeadline: boolean;
    contentReady: (typeof CLIENT_CONTENT_READY)[number];
    requirementsConfirmed: boolean;
    logoImage: string | null;
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
