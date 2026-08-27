import { LEAD_DATE_USE_TODAY, LEAD_FIELDS, LEAD_ORIGINS } from "@/lib/leads/constants";
import type { TLeadSourceProvider } from "@/types/lead-source.types";

export type TLeadOrigin = (typeof LEAD_ORIGINS)[number];

export type TLeadField = (typeof LEAD_FIELDS)[number];

export type TLeadDto = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  servicesInterestedIn: string | null;
  message: string;
  leadDate: string;
  /** Extra form/CSV columns not mapped to core fields (header → value). */
  extras: Record<string, string>;
  origin: TLeadOrigin;
  createdAt: string;
  updatedAt: string;
};

export type TLeadSummaryCounts = {
  total: number;
  this_month: number;
  last_month: number;
  this_year: number;
};

export type TLeadsListFilters = {
  from: string | null;
  to: string | null;
  q: string | null;
  counts: TLeadSummaryCounts;
};

export type TPaginatedLeads = {
  items: TLeadDto[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
    links: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  };
  filters: TLeadsListFilters;
};

export type TLeadColumnMapping = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  servicesInterestedIn: string;
  leadDate: string;
  /** CSV headers kept as extras (not mapped to a core field). */
  extras: string[];
};

export type TLeadsImportPreview = {
  headers: string[];
  rowCount: number;
  suggestedMapping: TLeadColumnMapping;
};

export type TLeadsImportResult = {
  imported: number;
  skippedDuplicates: number;
  skippedInvalid: number;
};

export type TLeadIngestVerifyDto = {
  source: {
    id: string;
    name: string;
    provider: TLeadSourceProvider;
  };
};

export type TLeadIngestResultDto = {
  lead: TLeadDto;
  replayed: boolean;
};

export { LEAD_DATE_USE_TODAY };
