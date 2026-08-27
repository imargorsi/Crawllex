"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type { TLeadSourceListDto, TLeadSourceSecretDto } from "@/types/lead-source.types";

const leadSourcesApi = {
  reducerPath: "lead-sources-api" as const,
};

export const leadSourcesKeys = {
  all: [leadSourcesApi.reducerPath] as const,
  list: (projectId: string) => [...leadSourcesKeys.all, "list", projectId] as const,
};

async function fetchLeadSources(projectId: string): Promise<TLeadSourceListDto> {
  const envelope = await baseQuery.get<TLeadSourceListDto>(
    `projects/${projectId}/integrations/lead-sources`,
  );
  return envelope.data;
}

export function useLeadSourcesQuery(
  projectId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();

  return useQuery({
    queryKey: leadSourcesKeys.list(projectId ?? ""),
    queryFn: () => fetchLeadSources(projectId!),
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

function invalidateLeadSources(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId?: string | null,
) {
  if (!projectId) return;
  void queryClient.invalidateQueries({ queryKey: leadSourcesKeys.list(projectId) });
}

export function useCreateLeadSourceMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const envelope = await baseQuery.post<TLeadSourceSecretDto>(
        `projects/${projectId}/integrations/lead-sources`,
      );
      return envelope.data;
    },
    gcTime: 0,
    onSuccess: () => invalidateLeadSources(queryClient, projectId),
  });
}

export function useRotateLeadSourceMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const envelope = await baseQuery.post<TLeadSourceSecretDto>(
        `projects/${projectId}/integrations/lead-sources/${sourceId}/rotate`,
      );
      return envelope.data;
    },
    gcTime: 0,
    onSuccess: () => invalidateLeadSources(queryClient, projectId),
  });
}

export function useRevealLeadSourceKeyMutation(projectId: string | null | undefined) {
  return useMutation({
    mutationFn: async (sourceId: string) => {
      const envelope = await baseQuery.get<TLeadSourceSecretDto>(
        `projects/${projectId}/integrations/lead-sources/${sourceId}/key`,
      );
      return envelope.data;
    },
    gcTime: 0,
  });
}

export function useDisconnectLeadSourceMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      await baseQuery.delete(`projects/${projectId}/integrations/lead-sources/${sourceId}`);
    },
    onSuccess: () => invalidateLeadSources(queryClient, projectId),
  });
}
