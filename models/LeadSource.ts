import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import {
  LEAD_SOURCE_DEFAULT_NAME,
  LEAD_SOURCE_PROVIDERS,
  LEAD_SOURCE_STATUSES,
} from "@/lib/leads/constants";

const leadSourceSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    provider: {
      type: String,
      enum: [...LEAD_SOURCE_PROVIDERS],
      required: true,
      default: "wordpress",
    },
    name: { type: String, required: true, trim: true, default: LEAD_SOURCE_DEFAULT_NAME },
    status: {
      type: String,
      enum: [...LEAD_SOURCE_STATUSES],
      required: true,
      default: "connected",
    },
    /** SHA-256 hex of the plaintext Lead Source Key. Never returned to the client. */
    keyHash: { type: String, required: true },
    /** Last 4 characters of the secret (debug / rotate identity). */
    keyPrefix: { type: String, required: true },
    /** AES-GCM payload of the plaintext key for admin View Key. Never listed on GET. */
    keyCiphertext: { type: String, default: null },
    /** WordPress site URL reported by the plugin on verify/ingest. */
    siteUrl: { type: String, default: null, trim: true },
    lastVerifiedAt: { type: Date, default: null },
    lastIngestedAt: { type: Date, default: null },
    lastError: { type: String, default: null, trim: true },
    ingestCount: { type: Number, required: true, default: 0 },
    failedCount: { type: Number, required: true, default: 0 },
    connectedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    connectedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

/**
 * MVP: one source per project per provider. Drop this unique index when
 * Settings allows multiple WordPress sites (schema fields already support 1:N).
 */
leadSourceSchema.index({ projectId: 1, provider: 1 }, { unique: true });
leadSourceSchema.index({ keyHash: 1 }, { unique: true });

export type LeadSourceDocument = InferSchemaType<typeof leadSourceSchema> &
  mongoose.Document & {
    projectId: Types.ObjectId;
    provider: (typeof LEAD_SOURCE_PROVIDERS)[number];
    name: string;
    status: (typeof LEAD_SOURCE_STATUSES)[number];
    keyHash: string;
    keyPrefix: string;
    keyCiphertext: string | null;
    siteUrl: string | null;
    lastVerifiedAt: Date | null;
    lastIngestedAt: Date | null;
    lastError: string | null;
    ingestCount: number;
    failedCount: number;
    connectedByUserId: Types.ObjectId;
    connectedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };

function hasMvpUniqueIndex(schema: mongoose.Schema): boolean {
  return schema.indexes().some(([keys, options]) => {
    const typedKeys = keys as Record<string, number>;
    return Boolean(options?.unique) && typedKeys.projectId === 1 && typedKeys.provider === 1;
  });
}

function registerLeadSourceModel(): Model<LeadSourceDocument> {
  const existing = mongoose.models.LeadSource as Model<LeadSourceDocument> | undefined;
  if (
    existing?.schema.path("keyHash") &&
    existing.schema.path("keyPrefix") &&
    existing.schema.path("keyCiphertext") &&
    existing.schema.path("siteUrl") &&
    hasMvpUniqueIndex(existing.schema)
  ) {
    return existing;
  }
  if (existing) {
    mongoose.deleteModel("LeadSource");
  }
  return mongoose.model<LeadSourceDocument>("LeadSource", leadSourceSchema);
}

export const LeadSource: Model<LeadSourceDocument> = registerLeadSourceModel();
