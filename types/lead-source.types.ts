import type { LEAD_SOURCE_PROVIDERS, LEAD_SOURCE_STATUSES } from "@/lib/leads/constants";

export type TLeadSourceProvider = (typeof LEAD_SOURCE_PROVIDERS)[number];

export type TLeadSourceStatus = (typeof LEAD_SOURCE_STATUSES)[number];

export type TLeadSourceDto = {
  id: string;
  projectId: string;
  provider: TLeadSourceProvider;
  name: string;
  status: TLeadSourceStatus;
  keyPrefix: string;
  siteUrl: string | null;
  lastVerifiedAt: string | null;
  lastIngestedAt: string | null;
  lastError: string | null;
  ingestCount: number;
  failedCount: number;
  connectedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type TLeadSourceListDto = {
  items: TLeadSourceDto[];
};

/** Returned from create and from View Key. List endpoints never include plaintext. */
export type TLeadSourceSecretDto = {
  source: TLeadSourceDto;
  plaintextKey: string;
};
