"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import { SEO_ACTIVITY_DEFAULT_PER_PAGE } from "@/lib/seo-activities/constants";
import type {
  TPaginatedSeoActivities,
  TSeoActivityDto,
  TSeoActivityType,
} from "@/types/seo-activity.types";

const seoActivitiesApi = {
  reducerPath: "seo-activities-api" as const,
};

export const seoActivitiesKeys = {
  all: [seoActivitiesApi.reducerPath] as const,
  list: (projectId: string, params: TSeoActivitiesListParams) =>
    [...seoActivitiesKeys.all, "list", projectId, params] as const,
};

export type TSeoActivitiesListParams = {
  type: TSeoActivityType;
  page?: number;
  per_page?: number;
  from?: string | null;
  to?: string | null;
};

export type TSeoActivityCreatePayload = {
  type: TSeoActivityType;
  /** Required unless pushing a blog to WordPress (the URL then comes from WordPress). */
  url?: string;
  occurredOn: string;
  title?: string;
  anchorText?: string;
  details?: string;
  pushToWordpress?: boolean;
  docUrl?: string;
};

export type TSeoActivityUpdatePayload = {
  url: string;
  occurredOn: string;
  title?: string;
  anchorText?: string;
  details?: string;
};

async function fetchSeoActivities(
  projectId: string,
  params: TSeoActivitiesListParams,
): Promise<TPaginatedSeoActivities> {
  const searchParams = new URLSearchParams();
  searchParams.set("type", params.type);
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("per_page", String(params.per_page ?? SEO_ACTIVITY_DEFAULT_PER_PAGE));
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const envelope = await baseQuery.get<TPaginatedSeoActivities>(
    `projects/${projectId}/seo-activities?${searchParams.toString()}`,
  );
  return envelope.data;
}

export function useSeoActivitiesQuery(
  projectId: string | null | undefined,
  params: TSeoActivitiesListParams,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();
  const page = params.page ?? 1;
  const perPage = params.per_page ?? SEO_ACTIVITY_DEFAULT_PER_PAGE;
  const from = params.from ?? null;
  const to = params.to ?? null;
  const listParams = { type: params.type, page, per_page: perPage, from, to };

  return useQuery({
    queryKey: seoActivitiesKeys.list(projectId ?? "", listParams),
    queryFn: () => fetchSeoActivities(projectId!, listParams),
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

export function useCreateSeoActivityMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TSeoActivityCreatePayload) => {
      const envelope = await baseQuery.post<TSeoActivityDto>(
        `projects/${projectId}/seo-activities`,
        payload,
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: [...seoActivitiesKeys.all, "list", projectId] });
    },
  });
}

export function useUpdateSeoActivityMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityId,
      payload,
    }: {
      activityId: string;
      payload: TSeoActivityUpdatePayload;
    }) => {
      const envelope = await baseQuery.patch<TSeoActivityDto>(
        `projects/${projectId}/seo-activities/${activityId}`,
        payload,
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: [...seoActivitiesKeys.all, "list", projectId] });
    },
  });
}

export function useDeleteSeoActivityMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      await baseQuery.delete(`projects/${projectId}/seo-activities/${activityId}`);
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: [...seoActivitiesKeys.all, "list", projectId] });
    },
  });
}

export async function fetchSeoActivitiesForExport(
  projectId: string,
  params: Omit<TSeoActivitiesListParams, "page" | "per_page">,
): Promise<TSeoActivityDto[]> {
  const result = await fetchSeoActivities(projectId, {
    ...params,
    page: 1,
    per_page: 100,
  });
  return result.items;
}
