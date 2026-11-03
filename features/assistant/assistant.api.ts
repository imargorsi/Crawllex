"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type {
  TAssistantHistoryDto,
  TAssistantQueryResult,
  TAssistantThreadDto,
  TAssistantThreadsDto,
} from "@/types/assistant.types";

const assistantApi = {
  reducerPath: "assistant-api" as const,
};

export const assistantKeys = {
  all: [assistantApi.reducerPath] as const,
  history: (projectId: string) => [...assistantKeys.all, "history", projectId] as const,
  threads: (projectId: string) => [...assistantKeys.all, "threads", projectId] as const,
  thread: (projectId: string, threadId: string) =>
    [...assistantKeys.all, "thread", projectId, threadId] as const,
};

export type TAssistantQueryPayload = {
  query: string;
  threadId?: string;
};

export function useAssistantHistoryQuery(
  projectId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  const token = useAccessToken();
  return useQuery({
    queryKey: assistantKeys.history(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TAssistantHistoryDto>(
        `projects/${projectId}/assistant/history`,
      );
      return envelope.data;
    },
    enabled: Boolean(projectId) && (options?.enabled ?? true) && Boolean(token),
  });
}

export function useAssistantThreadsQuery(projectId: string | null | undefined) {
  const token = useAccessToken();
  return useQuery({
    queryKey: assistantKeys.threads(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TAssistantThreadsDto>(
        `projects/${projectId}/assistant/threads`,
      );
      return envelope.data;
    },
    enabled: Boolean(projectId) && Boolean(token),
  });
}

export function useAssistantThreadQuery(
  projectId: string | null | undefined,
  threadId: string | null | undefined,
) {
  const token = useAccessToken();
  return useQuery({
    queryKey: assistantKeys.thread(projectId ?? "", threadId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TAssistantThreadDto>(
        `projects/${projectId}/assistant/threads/${threadId}`,
      );
      return envelope.data;
    },
    enabled: Boolean(projectId) && Boolean(threadId) && Boolean(token),
  });
}

export function useAssistantQueryMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TAssistantQueryPayload) => {
      if (!projectId) throw new Error("Missing project id");
      const envelope = await baseQuery.post<TAssistantQueryResult>(
        `projects/${projectId}/assistant/query`,
        payload,
      );
      return envelope.data;
    },
    onSuccess: (data) => {
      if (!projectId) return;
      queryClient.setQueryData(assistantKeys.history(projectId), {
        items: data.history,
      } satisfies TAssistantHistoryDto);
      void queryClient.invalidateQueries({ queryKey: assistantKeys.threads(projectId) });
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.thread(projectId, data.threadId),
      });
    },
  });
}
