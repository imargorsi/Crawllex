import type { SeoActivityDocument } from "@/models";
import type { TSeoActivityDto } from "@/types/seo-activity.types";

export type { TSeoActivityDto };

export function serializeSeoActivity(doc: SeoActivityDocument): TSeoActivityDto {
  return {
    id: String(doc._id),
    activityType: doc.activityType,
    url: doc.url,
    occurredOn: doc.occurredOn,
    title: doc.title ?? null,
    anchorText: doc.anchorText ?? null,
    details: doc.details ?? null,
    docUrl: doc.docUrl ?? null,
    pushedToWordpress: Boolean(doc.pushedToWordpress),
    wpPostId: doc.wpPostId ?? null,
    wpPostLink: doc.wpPostLink ?? null,
    wpPushedAt: doc.wpPushedAt ? doc.wpPushedAt.toISOString() : null,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}
