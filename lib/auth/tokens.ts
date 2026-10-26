import crypto from "crypto";
import { AccessToken } from "@/models";
import type { Types } from "mongoose";

/** Access tokens expire after 24 hours (server-side). */
export const ACCESS_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function randomToken(length = 40): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i]! % chars.length];
  }
  return result;
}

function hashToken(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export async function createAccessToken(userId: Types.ObjectId, name = "api"): Promise<string> {
  const plainTextToken = randomToken(40);
  const record = await AccessToken.create({
    userId,
    name,
    tokenHash: hashToken(plainTextToken),
    expiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
  });

  return `${record._id.toString()}|${plainTextToken}`;
}

export async function findAccessToken(plainToken: string | null): Promise<{
  tokenId: Types.ObjectId;
  userId: Types.ObjectId;
} | null> {
  if (!plainToken) return null;

  const [id, token] = plainToken.split("|", 2);
  if (!id || !token) return null;

  const record = await AccessToken.findById(id);
  if (!record) return null;

  const expected = hashToken(token);
  if (
    record.tokenHash.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(record.tokenHash), Buffer.from(expected))
  ) {
    return null;
  }

  if (!record.expiresAt || record.expiresAt.getTime() < Date.now()) {
    // Legacy never-expiring tokens (expiresAt null) are rejected so the 24h policy applies.
    await AccessToken.deleteOne({ _id: record._id });
    return null;
  }

  return { tokenId: record._id, userId: record.userId };
}

export async function revokeAccessToken(plainToken: string | null): Promise<boolean> {
  const found = await findAccessToken(plainToken);
  if (!found) return false;
  await AccessToken.deleteOne({ _id: found.tokenId });
  return true;
}

/** Revoke every session for a user (password reset, deactivate, delete — not ordinary login). */
export async function revokeAllUserTokens(userId: Types.ObjectId): Promise<void> {
  await AccessToken.deleteMany({ userId });
}
