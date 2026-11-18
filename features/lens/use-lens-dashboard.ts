"use client";

import { useMemo } from "react";

import { useLensSeoQuery, useLensUptimeQuery } from "@/features/lens/lens.api";
import type { TLensDashboard } from "@/features/lens/lens.types";
import { EMPTY_UPTIME } from "@/features/lens/uptime-format";

/**
 * Lens dashboard for the selected project. SEO and uptime both come from the Lens API.
 * Until uptime loads (or if it fails) the uptime parts show "unknown" with no figures, never sample data.
 */
export function useLensDashboard(projectId: string | null | undefined): {
  data: TLensDashboard | null;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useLensSeoQuery(projectId);
  const uptime = useLensUptimeQuery(projectId);
  const data = useMemo<TLensDashboard | null>(
    () => (query.data ? { ...query.data, ...(uptime.data ?? EMPTY_UPTIME) } : null),
    [query.data, uptime.data],
  );
  return { data, isLoading: query.isLoading, isError: query.isError };
}
