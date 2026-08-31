"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccessToken } from "@/hooks/use-access-token.hook";
import { baseQuery } from "@/lib/frontend/api/base";
import type { TClientStatus } from "@/lib/clients/constants";
import type { CreateClientInput, UpdateClientInput } from "@/schemas/client";
import type { TClientDetail, TClientListItem, TPublicClientView } from "@/types/client.types";

const clientsApi = {
  reducerPath: "clients-api" as const,
};

export const clientKeys = {
  all: [clientsApi.reducerPath] as const,
  list: (status?: TClientStatus | null) => [...clientKeys.all, "list", status ?? "all"] as const,
  detail: (clientId: string) => [...clientKeys.all, "detail", clientId] as const,
  public: (shareToken: string) => [...clientKeys.all, "public", shareToken] as const,
};

export type TCreateClientPayload = CreateClientInput;

export type TUpdateClientPayload = UpdateClientInput;

export type TCreateClientMutationInput = {
  payload: TCreateClientPayload;
  companyLogoFile?: File | null;
  assetFiles?: File[];
};

export type TUpdateClientMutationInput = {
  clientId: string;
  payload: TUpdateClientPayload;
  companyLogoFile?: File | null;
  assetFiles?: File[];
};

export type TClientStatusAction = "activate" | "deactivate";

function toClientFormData(
  payload: TCreateClientPayload | TUpdateClientPayload,
  companyLogoFile?: File | null,
  assetFiles: File[] = [],
): FormData {
  const formData = new FormData();
  formData.set("data", JSON.stringify(payload));
  if (companyLogoFile) {
    formData.set("company_logo", companyLogoFile);
  }
  for (const file of assetFiles) {
    formData.append("assets", file);
  }
  return formData;
}

type ClientsListEnvelope = {
  items: TClientListItem[];
};

async function fetchClients(status?: TClientStatus | null): Promise<TClientListItem[]> {
  const path = status ? `clients?status=${encodeURIComponent(status)}` : "clients";
  const envelope = await baseQuery.get<ClientsListEnvelope>(path);
  return envelope.data.items ?? [];
}

type TUseClientsQueryOptions = {
  status?: TClientStatus | null;
  enabled?: boolean;
};

export function useClientsQuery(options?: TUseClientsQueryOptions) {
  const status = options?.status ?? null;
  const token = useAccessToken();

  return useQuery<TClientListItem[]>({
    queryKey: clientKeys.list(status),
    queryFn: () => fetchClients(status),
    enabled: (options?.enabled ?? true) && Boolean(token),
  });
}

export function useClientQuery(clientId: string, options?: { enabled?: boolean }) {
  const token = useAccessToken();
  return useQuery({
    queryKey: clientKeys.detail(clientId),
    enabled: (options?.enabled ?? true) && Boolean(token && clientId),
    queryFn: async () => {
      const envelope = await baseQuery.get<TClientDetail>(`clients/${clientId}`);
      return envelope.data;
    },
  });
}

export function usePublicClientQuery(shareToken: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: clientKeys.public(shareToken),
    enabled: (options?.enabled ?? true) && Boolean(shareToken),
    queryFn: async () => {
      const envelope = await baseQuery.get<TPublicClientView>(`onboarding/${shareToken}`, { skipAuth: true });
      return envelope.data;
    },
    retry: false,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ payload, companyLogoFile, assetFiles }: TCreateClientMutationInput) => {
      const envelope = await baseQuery.post<TClientDetail>(
        "clients",
        toClientFormData(payload, companyLogoFile, assetFiles),
      );
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, payload, companyLogoFile, assetFiles }: TUpdateClientMutationInput) => {
      const envelope = await baseQuery.patch<TClientDetail>(
        `clients/${clientId}`,
        toClientFormData(payload, companyLogoFile, assetFiles),
      );
      return envelope.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      void queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}

export function useClientStatusActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, action }: { clientId: string; action: TClientStatusAction }) => {
      const envelope = await baseQuery.post<TClientDetail>(`clients/${clientId}/${action}`);
      return { data: envelope.data, message: envelope.message };
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
      void queryClient.invalidateQueries({ queryKey: clientKeys.detail(variables.clientId) });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      const envelope = await baseQuery.delete<null>(`clients/${clientId}`);
      return envelope;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}
