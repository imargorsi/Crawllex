import crypto from "crypto";

import { decryptSecret, encryptSecret } from "@/lib/crypto/secret-box";
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

/** Encrypt the plaintext key for admin View Key. List APIs never return this payload. */
export function encryptLeadSourceKey(plaintext: string): string {
  return encryptSecret(plaintext);
}

export function decryptLeadSourceKey(payload: string): string | null {
  return decryptSecret(payload);
}
