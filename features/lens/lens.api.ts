"use client";

import { useQuery } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";

/** Lens data as Crawllex shows it. Read-only: Lens runs and issues are changed only by Lens. */
export type TLensRun = {
  id: string;
  status: string;
  coverage: string | null;
  started_at: string;
  finished_at: string | null;
  pages: number;
  known_urls: number | null;
  error_code: string | null;
};

export type TLensIssue = {
  id: string;
  code: string;
  target: string;
  severity: string;
  status: string;
  first_seen: string;
  last_seen: string;
  occurrences: number;
  resolved_at: string | null;
};

export type TLensIncident = {
  id: string;
  url: string;
  status: string;
  opened_at: number;
  recovered_at: number | null;
  reason: string;
};

export type TLensFinding = {
  code: string;
  url: string;
  target: string;
  severity: string;
  confidence: string;
  recommendation: string;
  evidence: unknown;
};

export type TLensUptimeDay = {
  day: string;
  total: number;
  ok: number;
  uptimePct: number | null;
  avgMs: number | null;
};

export type TLensUptime = {
  days: number;
  probes: number;
  ok: number;
  uptimePct: number | null;
  avgMs: number | null;
  incidents: number;
  daily: TLensUptimeDay[];
  example: boolean;
};

export type TLensOverview = {
  runs: TLensRun[];
  issues: TLensIssue[];
  incidents: TLensIncident[];
};

export const lensKeys = {
  all: ["lens-api"] as const,
  overview: (projectId: string) => [...lensKeys.all, "overview", projectId] as const,
  findings: (projectId: string, runId: string) => [...lensKeys.all, "findings", projectId, runId] as const,
  uptime: (projectId: string, days: number) => [...lensKeys.all, "uptime", projectId, days] as const,
};

export function useLensOverviewQuery(projectId: string | null | undefined) {
  const token = useAccessToken();
  return useQuery({
    queryKey: lensKeys.overview(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TLensOverview>(`projects/${projectId}/lens`);
      return envelope.data ?? { runs: [], issues: [], incidents: [] };
    },
    enabled: Boolean(projectId) && Boolean(token),
    retry: false,
  });
}

export function useLensFindingsQuery(projectId: string | null | undefined, runId: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: lensKeys.findings(projectId ?? "", runId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<{ items: TLensFinding[] }>(`projects/${projectId}/lens/runs/${runId}/findings`);
      return envelope.data?.items ?? [];
    },
    enabled: Boolean(projectId) && Boolean(runId) && Boolean(token),
    retry: false,
  });
}

export function useLensUptimeQuery(projectId: string | null | undefined, days = 7) {
  const token = useAccessToken();
  return useQuery({
    queryKey: lensKeys.uptime(projectId ?? "", days),
    queryFn: async () => {
      const envelope = await baseQuery.get<TLensUptime>(`projects/${projectId}/lens/uptime?days=${days}`);
      return envelope.data ?? null;
    },
    enabled: Boolean(projectId) && Boolean(token),
    retry: false,
  });
}
