import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

/**
 * Monthly client report. The snapshot holds the collected data, so a
 * saved report renders the same way later even if the cache changes. The PDF is rendered on demand.
 */
const reportSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    periodFrom: { type: String, required: true, trim: true },
    periodTo: { type: String, required: true, trim: true },
    previousFrom: { type: String, required: true, trim: true },
    previousTo: { type: String, required: true, trim: true },
    summary: { type: String, default: null },
    title: { type: String, required: true, trim: true },
    /** Hand-written text and next steps (see `lib/reports/rich-text.ts`). */
    notes: { type: Schema.Types.Mixed, default: () => ({}) },
    /** Collected data (see `types/reports.types.ts`). */
    snapshot: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  // Keep empty objects (for example `leads.byOrigin` with no leads). Mongoose would drop them otherwise.
  { timestamps: true, minimize: false },
);

reportSchema.index({ projectId: 1, createdAt: -1 });

export type ReportDocument = InferSchemaType<typeof reportSchema> &
  mongoose.Document & {
    projectId: Types.ObjectId;
    createdBy: Types.ObjectId;
  };

export const Report: Model<ReportDocument> =
  mongoose.models.Report ?? mongoose.model<ReportDocument>("Report", reportSchema);
