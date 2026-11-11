"use client";

import { useQuery } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type { TLensSeoDashboard } from "@/features/lens/lens.types";

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
