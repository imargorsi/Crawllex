import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import { CLIENT_STATUSES, DEFAULT_CLIENT_STATUS } from "@/lib/clients/constants";
import {
  CLIENT_FILE_KINDS,
  CLIENT_INTEGRATIONS,
  CLIENT_MOBILE_PLATFORMS,
  CLIENT_PROJECT_TYPES,
  CLIENT_WEB_APP_TYPES,
  CLIENT_WEBSITE_FOCUS,
} from "@/lib/clients/intake-constants";

const featureSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    whatItDoes: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const linkSchema = new Schema(
  {
    linkName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const fileSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    mime: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true },
    kind: { type: String, enum: [...CLIENT_FILE_KINDS], required: true },
    blob: { type: String, required: true, trim: true },
    uploadedAt: { type: Date, required: true },
  },
  { _id: false },
);

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
    projectDescription: { type: String, required: true, trim: true },
    projectTypes: { type: [String], enum: [...CLIENT_PROJECT_TYPES], default: [] },
    projectTypeOther: { type: String, default: null, trim: true },
    websiteFocus: { type: [String], enum: [...CLIENT_WEBSITE_FOCUS], default: [] },
    mobilePlatforms: { type: [String], enum: [...CLIENT_MOBILE_PLATFORMS], default: [] },
    webAppTypes: { type: [String], enum: [...CLIENT_WEB_APP_TYPES], default: [] },
    webAppTypeOther: { type: String, default: null, trim: true },
    features: { type: [featureSchema], default: [] },
    integrations: { type: [String], enum: [...CLIENT_INTEGRATIONS], default: [] },
    integrationOther: { type: String, default: null, trim: true },
    links: { type: [linkSchema], default: [] },
    files: { type: [fileSchema], default: [] },
    notes: { type: String, default: null, trim: true },
    expectedLaunchDate: { type: String, default: null, trim: true },
    launchMustHaves: { type: String, required: true, trim: true },
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
    projectDescription: string;
    projectTypes: (typeof CLIENT_PROJECT_TYPES)[number][];
    projectTypeOther: string | null;
    websiteFocus: (typeof CLIENT_WEBSITE_FOCUS)[number][];
    mobilePlatforms: (typeof CLIENT_MOBILE_PLATFORMS)[number][];
    webAppTypes: (typeof CLIENT_WEB_APP_TYPES)[number][];
    webAppTypeOther: string | null;
    features: { name: string; whatItDoes: string }[];
    integrations: (typeof CLIENT_INTEGRATIONS)[number][];
    integrationOther: string | null;
    links: { linkName: string; url: string }[];
    files: {
      id: string;
      originalName: string;
      mime: string;
      sizeBytes: number;
      kind: (typeof CLIENT_FILE_KINDS)[number];
      blob: string;
      uploadedAt: Date;
    }[];
    notes: string | null;
    expectedLaunchDate: string | null;
    launchMustHaves: string;
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
