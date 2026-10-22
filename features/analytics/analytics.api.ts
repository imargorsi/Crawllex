"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Hooks
import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import { projectKeys } from "@/features/projects/projects.api";
import type { TGoogleIntegrationService } from "@/lib/integrations/constants";
import type {
  TAnalyticsDimensionsDto,
  TAnalyticsOverviewDto,
  TAnalyticsSyncResultDto,
  TGooglePropertyOption,
  TProjectIntegrationDto,
} from "@/types/analytics.types";

const analyticsApi = {
  reducerPath: "analytics-api" as const,
};

export const analyticsKeys = {
  all: [analyticsApi.reducerPath] as const,
  overview: (projectId: string, from: string, to: string) =>
    [...analyticsKeys.all, "overview", projectId, from, to] as const,
  dimensions: (
    projectId: string,
    params: {
      from: string;
      to: string;
      source: string;
      dimensionType: string;
      limit: number;
    },
  ) => [...analyticsKeys.all, "dimensions", projectId, params] as const,
  properties: (projectId: string) => [...analyticsKeys.all, "properties", projectId] as const,
};

export type TAnalyticsOverviewParams = {
  from: string;
  to: string;
};

export type TAnalyticsDimensionsParams = {
  from: string;
  to: string;
  source: "gsc" | "ga4";
  dimensionType: "query" | "page" | "country" | "device" | "landing_page" | "channel_group";
  limit?: number;
};

async function fetchOverview(
  projectId: string,
  params: TAnalyticsOverviewParams,
): Promise<TAnalyticsOverviewDto> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
  });
  const envelope = await baseQuery.get<TAnalyticsOverviewDto>(
    `projects/${projectId}/analytics/overview?${searchParams.toString()}`,
  );
  return envelope.data;
}

async function fetchDimensions(
  projectId: string,
  params: TAnalyticsDimensionsParams,
): Promise<TAnalyticsDimensionsDto> {
  const searchParams = new URLSearchParams({
    from: params.from,
    to: params.to,
    source: params.source,
    dimensionType: params.dimensionType,
    limit: String(params.limit ?? 25),
  });
  const envelope = await baseQuery.get<TAnalyticsDimensionsDto>(
    `projects/${projectId}/analytics/dimensions?${searchParams.toString()}`,
  );
  return envelope.data;
}

/** Max rows per dimension sheet (API cap). */
export const ANALYTICS_EXPORT_DIMENSION_LIMIT = 100;

export type TAnalyticsExportBundle = {
  overview: TAnalyticsOverviewDto;
  queries: TAnalyticsDimensionsDto;
  pages: TAnalyticsDimensionsDto;
  channels: TAnalyticsDimensionsDto;
  countries: TAnalyticsDimensionsDto;
};

/** Fetch overview + dimension breakdowns for Excel export. */
export async function fetchAnalyticsReportForExport(
  projectId: string,
  params: TAnalyticsOverviewParams,
): Promise<TAnalyticsExportBundle> {
  const shared = { from: params.from, to: params.to, limit: ANALYTICS_EXPORT_DIMENSION_LIMIT };
  const [overview, queries, pages, channels, countries] = await Promise.all([
    fetchOverview(projectId, params),
    fetchDimensions(projectId, { ...shared, source: "gsc", dimensionType: "query" }),
    fetchDimensions(projectId, { ...shared, source: "gsc", dimensionType: "page" }),
    fetchDimensions(projectId, {
      ...shared,
      source: "ga4",
      dimensionType: "channel_group",
    }),
    fetchDimensions(projectId, { ...shared, source: "ga4", dimensionType: "country" }),
  ]);

  return { overview, queries, pages, channels, countries };
}

export function useAnalyticsExportMutation(projectId: string | null | undefined) {
  return useMutation({
    mutationFn: (params: TAnalyticsOverviewParams) => {
      if (!projectId) throw new Error("Missing project id");
      return fetchAnalyticsReportForExport(projectId, params);
    },
  });
}

export function useAnalyticsOverviewQuery(
  projectId: string | null | undefined,
  params: TAnalyticsOverviewParams,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();
  return useQuery({
    queryKey: analyticsKeys.overview(projectId ?? "", params.from, params.to),
    queryFn: () => fetchOverview(projectId!, params),
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

export function useAnalyticsDimensionsQuery(
  projectId: string | null | undefined,
  params: TAnalyticsDimensionsParams,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();
  const limit = params.limit ?? 25;
  const queryParams = {
    from: params.from,
    to: params.to,
    source: params.source,
    dimensionType: params.dimensionType,
    limit,
  };

  return useQuery({
    queryKey: analyticsKeys.dimensions(projectId ?? "", queryParams),
    queryFn: () => fetchDimensions(projectId!, { ...params, limit }),
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

export function useGooglePropertiesQuery(
  projectId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();
  return useQuery({
    queryKey: analyticsKeys.properties(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<{ properties: TGooglePropertyOption[] }>(
        `projects/${projectId}/integrations/google/properties`,
      );
      return envelope.data.properties;
    },
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

export function useConnectGoogleIntegrationMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      service: TGoogleIntegrationService;
      externalPropertyId: string;
    }) => {
      const envelope = await baseQuery.put<TProjectIntegrationDto>(
        `projects/${projectId}/integrations/google/${payload.service}`,
        { externalPropertyId: payload.externalPropertyId },
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useDisconnectGoogleIntegrationMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: TGoogleIntegrationService) => {
      const envelope = await baseQuery.delete<TProjectIntegrationDto | null>(
        `projects/${projectId}/integrations/google/${service}`,
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useSyncGoogleIntegrationsMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const envelope = await baseQuery.post<TAnalyticsSyncResultDto>(
        `projects/${projectId}/integrations/google/sync`,
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
