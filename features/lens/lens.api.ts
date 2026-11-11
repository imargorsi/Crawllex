"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type { TLensSeoDashboard } from "@/features/lens/lens.types";

/** Start a manual check. Super admin only (the server enforces it; the UI shows the button to super admins only). */
export function useStartLensRunMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const envelope = await baseQuery.post<{ jobId: string; status: string; created: boolean }>(`projects/${projectId}/lens/runs`);
      return envelope.data;
    },
    onSuccess: () => {
      // The new check shows in the dashboard once it completes; refresh the saved data then.
      if (projectId) void queryClient.invalidateQueries({ queryKey: lensKeys.seo(projectId) });
    },
  });
}

export const lensKeys = {
  all: ["lens-api"] as const,
  seo: (projectId: string) => [...lensKeys.all, "seo", projectId] as const,
};

/** The SEO dashboard for a project, from the latest Lens data. Read-only. */
export function useLensSeoQuery(projectId: string | null | undefined) {
  const token = useAccessToken();
  return useQuery({
    queryKey: lensKeys.seo(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TLensSeoDashboard>(`projects/${projectId}/lens/seo`);
      if (!envelope.data) throw new Error("Lens returned no data.");
      return envelope.data;
    },
    enabled: Boolean(projectId) && Boolean(token),
    retry: false,
  });
}
