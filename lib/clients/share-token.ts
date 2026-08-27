import crypto from "crypto";

import { CLIENT_SHARE_TOKEN_BYTES, CLIENT_SHARE_TOKEN_PREFIX } from "@/lib/clients/constants";

export function createClientShareToken(): string {
  return `${CLIENT_SHARE_TOKEN_PREFIX}${crypto.randomBytes(CLIENT_SHARE_TOKEN_BYTES).toString("hex")}`;
}

export function isClientShareTokenFormat(value: string): boolean {
  const expectedLength = CLIENT_SHARE_TOKEN_PREFIX.length + CLIENT_SHARE_TOKEN_BYTES * 2;
  if (value.length !== expectedLength) return false;
  if (!value.startsWith(CLIENT_SHARE_TOKEN_PREFIX)) return false;
  return /^[a-f0-9]+$/i.test(value.slice(CLIENT_SHARE_TOKEN_PREFIX.length));
}
