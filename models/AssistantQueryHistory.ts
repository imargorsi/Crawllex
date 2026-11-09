import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const assistantQueryHistorySchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    /** Conversation id. Rows written before threads existed have none (treated as their own thread). */
    threadId: { type: String, trim: true, maxlength: 64, default: null },
    query: { type: String, required: true, trim: true, maxlength: 500 },
    /** The assistant reply shown to the user. Empty for rows written before threads existed. */
    answer: { type: String, trim: true, maxlength: 4000, default: "" },
    intent: { type: String, required: true, trim: true, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

assistantQueryHistorySchema.index({ projectId: 1, userId: 1, createdAt: -1 });
assistantQueryHistorySchema.index({ projectId: 1, userId: 1, threadId: 1, createdAt: 1 });

export type AssistantQueryHistoryDocument = InferSchemaType<typeof assistantQueryHistorySchema> & mongoose.Document;

export const AssistantQueryHistory: Model<AssistantQueryHistoryDocument> =
  (mongoose.models.AssistantQueryHistory as Model<AssistantQueryHistoryDocument> | undefined) ??
  mongoose.model<AssistantQueryHistoryDocument>("AssistantQueryHistory", assistantQueryHistorySchema);
