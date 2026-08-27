import { LEAD_SOURCE_SITE_URL_MAX_LENGTH } from "@/lib/leads/constants";
import { LeadSource, type LeadSourceDocument } from "@/models";

export function sanitizeLeadSourceSiteUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed.length > LEAD_SOURCE_SITE_URL_MAX_LENGTH) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    const path = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${path}`;
  } catch {
    return null;
  }
}

export async function stampLeadSourceSiteUrl(
  source: LeadSourceDocument,
  raw: string | undefined,
): Promise<void> {
  const siteUrl = sanitizeLeadSourceSiteUrl(raw);
  if (!siteUrl || source.siteUrl === siteUrl) return;
  await LeadSource.updateOne({ _id: source._id }, { $set: { siteUrl } });
  source.siteUrl = siteUrl;
}
