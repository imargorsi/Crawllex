"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type {
  TAssistantQueryResult,
  TAssistantThreadDto,
  TAssistantThreadsDto,
} from "@/types/assistant.types";

const assistantApi = {
  reducerPath: "assistant-api" as const,
};

export const assistantKeys = {
  all: [assistantApi.reducerPath] as const,
  threads: (projectId: string) => [...assistantKeys.all, "threads", projectId] as const,
  thread: (projectId: string, threadId: string) =>
    [...assistantKeys.all, "thread", projectId, threadId] as const,
};

export type TAssistantQueryPayload = {
  query: string;
  threadId?: string;
};

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
      void queryClient.invalidateQueries({ queryKey: assistantKeys.threads(projectId) });
      void queryClient.invalidateQueries({
        queryKey: assistantKeys.thread(projectId, data.threadId),
      });
    },
  });
}

/** Deletes one conversation. Refreshes the conversation list. */
export function useDeleteAssistantThreadMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (threadId: string) => {
      await baseQuery.delete(`projects/${projectId}/assistant/threads/${threadId}`);
      return threadId;
    },
    onSuccess: (threadId) => {
      if (!projectId) return;
      queryClient.removeQueries({ queryKey: assistantKeys.thread(projectId, threadId) });
      void queryClient.invalidateQueries({ queryKey: assistantKeys.threads(projectId) });
    },
  });
}

/** Deletes every conversation of the signed-in user in this project. */
export function useDeleteAllAssistantThreadsMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await baseQuery.delete(`projects/${projectId}/assistant/threads`);
    },
    onSuccess: () => {
      if (!projectId) return;
      queryClient.removeQueries({ queryKey: [...assistantKeys.all, "thread", projectId] });
      void queryClient.invalidateQueries({ queryKey: assistantKeys.threads(projectId) });
    },
  });
}
