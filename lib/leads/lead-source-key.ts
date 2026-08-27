import crypto from "crypto";

import { env } from "@/lib/config/env";
import { LEAD_SOURCE_KEY_BYTES, LEAD_SOURCE_KEY_PREFIX } from "@/lib/leads/constants";

export type TGeneratedLeadSourceKey = {
  plaintext: string;
  keyHash: string;
  keyPrefix: string;
};

export function hashLeadSourceKey(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export function leadSourceKeyPrefix(plain: string): string {
  const secret = plain.startsWith(LEAD_SOURCE_KEY_PREFIX)
    ? plain.slice(LEAD_SOURCE_KEY_PREFIX.length)
    : plain;
  return secret.slice(-4);
}

export function generateLeadSourceKey(): TGeneratedLeadSourceKey {
  const secret = crypto.randomBytes(LEAD_SOURCE_KEY_BYTES).toString("hex");
  const plaintext = `${LEAD_SOURCE_KEY_PREFIX}${secret}`;
  return {
    plaintext,
    keyHash: hashLeadSourceKey(plaintext),
    keyPrefix: leadSourceKeyPrefix(plaintext),
  };
}

function encryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.appKey()).digest();
}

/** Encrypt the plaintext key for admin View Key. List APIs never return this payload. */
export function encryptLeadSourceKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptLeadSourceKey(payload: string): string | null {
  const parts = payload.split(".");
  if (parts[0] !== "v1" || parts.length !== 4 || !parts[1] || !parts[2] || !parts[3]) {
    return null;
  }
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(parts[1], "base64url"),
    );
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(parts[3], "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
