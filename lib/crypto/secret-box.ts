import crypto from "crypto";

import { env } from "@/lib/config/env";

/**
 * AES-256-GCM secret box keyed from APP_KEY. Payload format: `v1.<iv>.<tag>.<ciphertext>` (base64url).
 * Used for values the server must read back later (lead source keys, WordPress application passwords).
 * Never return a decrypted value to a client.
 */
function encryptionKey(): Buffer {
  return crypto.createHash("sha256").update(env.appKey()).digest();
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/** Returns null for malformed, tampered or wrong-key payloads. */
export function decryptSecret(payload: string): string | null {
  const parts = payload.split(".");
  if (parts[0] !== "v1" || parts.length !== 4 || !parts[1] || !parts[2] || !parts[3]) {
    return null;
  }
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(parts[1], "base64url"));
    decipher.setAuthTag(Buffer.from(parts[2], "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
