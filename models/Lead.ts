import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

import { LEAD_ORIGINS } from "@/lib/leads/constants";

const leadSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, default: "" },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    servicesInterestedIn: { type: String, default: null },
    message: { type: String, required: true },
    /** Calendar date for the lead (YYYY-MM-DD) — from CSV match or today. */
    leadDate: { type: String, required: true },
    /**
     * Extra CSV / form columns that are not core Crawllex fields.
     * Keys are source headers; values are trimmed strings.
     */
    extras: { type: Schema.Types.Mixed, default: () => ({}) },
    normalizedEmail: { type: String, required: true },
    normalizedPhone: { type: String, default: "" },
    origin: { type: String, enum: LEAD_ORIGINS, required: true },
    /** WordPress ingest only — which LeadSource accepted the payload. */
    leadSourceId: { type: Schema.Types.ObjectId, ref: "LeadSource", default: null },
    /** Plugin retry key. Unique per source when present. */
    idempotencyKey: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

leadSchema.index({ projectId: 1, leadDate: -1 });
leadSchema.index({ projectId: 1, createdAt: -1 });
leadSchema.index({ projectId: 1, normalizedEmail: 1, normalizedPhone: 1 }, { unique: true });
leadSchema.index(
  { leadSourceId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      leadSourceId: { $type: "objectId" },
      idempotencyKey: { $type: "string" },
    },
  },
);

export type LeadDocument = InferSchemaType<typeof leadSchema> &
  mongoose.Document & {
    projectId: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    servicesInterestedIn: string | null;
    message: string;
    leadDate: string;
    extras: Record<string, string>;
    normalizedEmail: string;
    normalizedPhone: string;
    origin: (typeof LEAD_ORIGINS)[number];
    leadSourceId: Types.ObjectId | null;
    idempotencyKey: string | null;
    createdBy: Types.ObjectId;
    updatedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

function hasIdempotencyIndex(schema: mongoose.Schema): boolean {
  return schema.indexes().some(([keys, options]) => {
    const typedKeys = keys as Record<string, number>;
    return Boolean(options?.unique) && typedKeys.leadSourceId === 1 && typedKeys.idempotencyKey === 1;
  });
}

function originAllowsWordpress(schema: mongoose.Schema): boolean {
  const path = schema.path("origin") as
    | { enumValues?: unknown; options?: { enum?: unknown } }
    | undefined;
  const values = path?.enumValues ?? path?.options?.enum;
  return Array.isArray(values) && values.includes("wordpress");
}

/**
 * Dev HMR reuses `mongoose.models.Lead`. If the cached schema is stale
 * (still has `name` / missing core paths), delete and recompile so imports persist.
 */
function registerLeadModel(): Model<LeadDocument> {
  const existing = mongoose.models.Lead as Model<LeadDocument> | undefined;

  if (
    existing?.schema.path("firstName") &&
    existing.schema.path("lastName") &&
    existing.schema.path("extras")?.instance === "Mixed" &&
    existing.schema.path("leadSourceId") &&
    existing.schema.path("idempotencyKey") &&
    !existing.schema.path("name") &&
    hasIdempotencyIndex(existing.schema) &&
    originAllowsWordpress(existing.schema)
  ) {
    return existing;
  }

  if (existing) {
    mongoose.deleteModel("Lead");
  }

  return mongoose.model<LeadDocument>("Lead", leadSchema);
}

export const Lead: Model<LeadDocument> = registerLeadModel();
