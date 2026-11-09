"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { baseQuery } from "@/lib/frontend/api/base";
import { getAccessToken } from "@/lib/frontend/auth/session";
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

export type TAssistantQueryVariables = TAssistantQueryPayload & { onToken?: (text: string) => void };

/**
 * Asks one question over the streaming route. `onToken` receives AI text as it is generated.
 * The final result has the same shape as the JSON route.
 */
export async function streamAssistantQuery(
  projectId: string,
  payload: TAssistantQueryPayload,
  onToken: (text: string) => void,
): Promise<TAssistantQueryResult> {
  const token = getAccessToken();
  const response = await fetch(`/api/v1/projects/${projectId}/assistant/query/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok || !response.body) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message || "Request failed", response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: TAssistantQueryResult | null = null;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const raw = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
      const { event, data } = parseSseEvent(raw);
      if (event === "token" && typeof data?.text === "string") onToken(data.text);
      if (event === "done") result = data as unknown as TAssistantQueryResult;
      if (event === "error") throw new ApiError(String(data?.message ?? "Request failed"), 500);
    }
  }

  if (!result) throw new ApiError("The assistant did not finish the answer.", 500);
  return result;
}

function parseSseEvent(raw: string): { event: string; data: Record<string, unknown> | null } {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  try {
    return { event, data: data ? (JSON.parse(data) as Record<string, unknown>) : null };
  } catch {
    return { event, data: null };
  }
}

export function useAssistantQueryMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ onToken, ...payload }: TAssistantQueryVariables) => {
      if (!projectId) throw new Error("Missing project id");
      return streamAssistantQuery(projectId, payload, onToken ?? (() => undefined));
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
