import { Client } from "@/models/Client";

import { CLIENT_SHARE_TOKEN_BYTES, CLIENT_SHARE_TOKEN_PREFIX } from "@/lib/clients/constants";

const SHARE_SLUG_MAX = 60;

/** Legacy random tokens (`clx_ob_` + hex) still resolve so existing links do not 404. */
export function isLegacyClientShareToken(value: string): boolean {
  const expectedLength = CLIENT_SHARE_TOKEN_PREFIX.length + CLIENT_SHARE_TOKEN_BYTES * 2;
  if (value.length !== expectedLength) return false;
  if (!value.startsWith(CLIENT_SHARE_TOKEN_PREFIX)) return false;
  return /^[a-f0-9]+$/i.test(value.slice(CLIENT_SHARE_TOKEN_PREFIX.length));
}

export function slugifyClientSharePath(businessName: string): string {
  const slug = businessName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SHARE_SLUG_MAX);
  return slug || "client";
}

export function isClientSharePathFormat(value: string): boolean {
  if (!value || value.length > 80) return false;
  if (isLegacyClientShareToken(value)) return true;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function createUniqueClientShareSlug(
  businessName: string,
  excludeClientId?: string,
): Promise<string> {
  const base = slugifyClientSharePath(businessName);
  let candidate = base;
  let suffix = 2;

  while (
    await Client.exists({
      shareToken: candidate,
      ...(excludeClientId ? { _id: { $ne: excludeClientId } } : {}),
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function upgradeLegacyClientShareSlug(client: {
  _id: { toString(): string };
  businessName: string;
  shareToken: string;
  save: () => Promise<unknown>;
}): Promise<void> {
  if (!isLegacyClientShareToken(client.shareToken)) return;
  const previous = client.shareToken;
  try {
    client.shareToken = await createUniqueClientShareSlug(client.businessName, client._id.toString());
    await client.save();
  } catch {
    client.shareToken = previous;
  }
}

export function shouldRefreshClientShareSlug(shareToken: string, businessName: string): boolean {
  if (isLegacyClientShareToken(shareToken)) return true;
  const base = slugifyClientSharePath(businessName);
  if (shareToken === base) return false;
  if (!shareToken.startsWith(`${base}-`)) return true;
  return !/^\d+$/.test(shareToken.slice(base.length + 1));
}
