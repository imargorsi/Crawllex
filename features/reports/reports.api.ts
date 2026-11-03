"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { ApiError } from "@/lib/frontend/api/errors";
import { baseQuery } from "@/lib/frontend/api/base";
import { getAccessToken } from "@/lib/frontend/auth/session";
import type { CreateReportInput } from "@/schemas/reports";
import type { TReportDetailDto, TReportListItemDto } from "@/types/reports.types";

export const reportsKeys = {
  all: ["reports-api"] as const,
  list: (projectId: string) => [...reportsKeys.all, "list", projectId] as const,
  detail: (projectId: string, reportId: string) =>
    [...reportsKeys.all, "detail", projectId, reportId] as const,
};

export type TCreateReportPayload = CreateReportInput;

export function useReportsQuery(projectId: string | null | undefined) {
  const token = useAccessToken();
  return useQuery({
    queryKey: reportsKeys.list(projectId ?? ""),
    queryFn: async () => {
      const envelope = await baseQuery.get<TReportListItemDto[]>(`projects/${projectId}/reports`);
      return envelope.data ?? [];
    },
    enabled: Boolean(projectId) && Boolean(token),
  });
}

export function useReportQuery(projectId: string | null | undefined, reportId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: reportsKeys.detail(projectId ?? "", reportId),
    queryFn: async () => {
      const envelope = await baseQuery.get<TReportDetailDto>(
        `projects/${projectId}/reports/${reportId}`,
      );
      return envelope.data;
    },
    enabled: Boolean(projectId) && Boolean(token) && Boolean(reportId),
  });
}

export function useCreateReportMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TCreateReportPayload) => {
      const envelope = await baseQuery.post<TReportDetailDto>(
        `projects/${projectId}/reports`,
        payload,
      );
      return envelope.data;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: reportsKeys.list(projectId) });
    },
  });
}

export function useDeleteReportMutation(projectId: string | null | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId: string) => {
      await baseQuery.delete(`projects/${projectId}/reports/${reportId}`);
      return reportId;
    },
    onSuccess: () => {
      if (!projectId) return;
      void queryClient.invalidateQueries({ queryKey: reportsKeys.list(projectId) });
    },
  });
}

/**
 * Binary and HTML endpoints bypass the JSON envelope, so they are fetched with the Bearer token
 * directly. Errors are read from the JSON error body when present.
 */
async function fetchReportResponse(projectId: string, reportId: string) {
  const token = getAccessToken();
  const response = await fetch(`/api/v1/projects/${projectId}/reports/${reportId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(body?.message || "Request failed", response.status);
  }
  return response;
}

export async function fetchReportPdf(projectId: string, reportId: string): Promise<Blob> {
  const response = await fetchReportResponse(projectId, reportId);
  return response.blob();
}

