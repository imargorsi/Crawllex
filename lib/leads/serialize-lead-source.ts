import type { LeadSourceDocument } from "@/models/LeadSource";
import type { TLeadSourceDto } from "@/types/lead-source.types";

export function serializeLeadSource(doc: LeadSourceDocument): TLeadSourceDto {
  return {
    id: String(doc._id),
    projectId: String(doc.projectId),
    provider: doc.provider,
    name: doc.name,
    status: doc.status,
    keyPrefix: doc.keyPrefix,
    siteUrl: doc.siteUrl ? doc.siteUrl : null,
    lastVerifiedAt: doc.lastVerifiedAt ? doc.lastVerifiedAt.toISOString() : null,
    lastIngestedAt: doc.lastIngestedAt ? doc.lastIngestedAt.toISOString() : null,
    lastError: doc.lastError ? doc.lastError : null,
    ingestCount: doc.ingestCount,
    failedCount: doc.failedCount,
    connectedAt: doc.connectedAt.toISOString(),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
