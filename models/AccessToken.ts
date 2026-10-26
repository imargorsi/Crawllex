import mongoose, { Schema, type InferSchemaType, type Model, type Types } from "mongoose";

const accessTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, default: "api" },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type AccessTokenDocument = InferSchemaType<typeof accessTokenSchema> &
  mongoose.Document & {
    userId: Types.ObjectId;
  };

export const AccessToken: Model<AccessTokenDocument> =
  mongoose.models.AccessToken ?? mongoose.model<AccessTokenDocument>("AccessToken", accessTokenSchema);
