"use client";

import { useMemo } from "react";

import { LENS_DEMO_UPTIME } from "@/features/lens/lens.demo";
import { useLensSeoQuery } from "@/features/lens/lens.api";
import type { TLensDashboard } from "@/features/lens/lens.types";

/**
 * Lens dashboard for the selected project. SEO comes from the Lens API. Uptime and incidents are
 * still demo data until the uptime phase.
 */
export function useLensDashboard(projectId: string | null | undefined): {
  data: TLensDashboard | null;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useLensSeoQuery(projectId);
  const data = useMemo<TLensDashboard | null>(
    () => (query.data ? { ...query.data, ...LENS_DEMO_UPTIME } : null),
    [query.data],
  );
  return { data, isLoading: query.isLoading, isError: query.isError };
}
