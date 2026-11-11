"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { baseQuery } from "@/lib/frontend/api/base";
import type { ProjectStatus, TSeoGoal } from "@/lib/projects/constants";
import type { TProjectStatusAction } from "@/lib/projects/project-card-actions.utils";
import type { TProjectDetail, TProjectListItem } from "@/types/project.types";
import { useAccessToken } from "@/hooks/use-access-token.hook";

export type {
  TProjectDetail,
  TProjectListItem,
  TProjectOwnerSummary,
} from "@/types/project.types";

const projectsApi = {
  reducerPath: "projects-api" as const,
};

export const projectKeys = {
  all: [projectsApi.reducerPath] as const,
  list: (status?: ProjectStatus | null) => [...projectKeys.all, "list", status ?? "all"] as const,
  detail: (projectId: string) => [...projectKeys.all, "detail", projectId] as const,
  access: (projectId: string) => [...projectKeys.all, "access", projectId] as const,
};

export type TProjectAccess = {
  projectId: string;
  roles: string[];
  permissions: string[];
};

type ProjectsListEnvelope = {
  items: TProjectListItem[];
};

type CreateProjectResponse = {
  id: string;
  businessName: string;
  websiteUrl: string;
  status: ProjectStatus;
  logoImage: string | null;
};

export type TCreateProjectMutationInput = {
  payload: TCreateProjectPayload;
  companyLogoFile?: File | null;
};

export type TCreateProjectPayload = {
  businessName: string;
  websiteUrl: string;
  businessAddress?: string | null;
  pocContactNumber?: string | null;
  servicesOffered?: string[];
  primaryServiceToPromote?: string | null;
  idealCustomerProfile?: string | null;
  targetLocations?: string[];
  seoGoals?: TSeoGoal[];
  competitorUrls?: string[];
  ownerUserId?: string;
};

export type TUpdateProjectPayload = {
  websiteUrl: string;
  businessAddress?: string | null;
  pocContactNumber?: string | null;
  servicesOffered?: string[];
  primaryServiceToPromote?: string | null;
  idealCustomerProfile?: string | null;
  targetLocations?: string[];
  seoGoals?: TSeoGoal[];
  competitorUrls?: string[];
  /** `super_admin` only — reassigns project owner. */
  ownerUserId?: string;
};

export type TUpdateProjectMutationInput = {
  projectId: string;
  payload: TUpdateProjectPayload;
  companyLogoFile?: File | null;
};

async function fetchProjects(status?: ProjectStatus | null): Promise<TProjectListItem[]> {
  const path = status ? `projects?status=${encodeURIComponent(status)}` : "projects";
  const envelope = await baseQuery.get<ProjectsListEnvelope>(path);
  return envelope.data.items ?? [];
}

type TUseProjectsQueryOptions = {
  status?: ProjectStatus | null;
  enabled?: boolean;
};

export function useProjectsQuery(options?: TUseProjectsQueryOptions) {
  const status = options?.status ?? null;
  const token = useAccessToken();

  return useQuery<TProjectListItem[]>({
    queryKey: projectKeys.list(status),
    queryFn: () => fetchProjects(status),
    enabled: (options?.enabled ?? true) && Boolean(token),
  });
}

async function fetchProject(projectId: string): Promise<TProjectDetail> {
  const envelope = await baseQuery.get<TProjectDetail>(`projects/${projectId}`);
  return envelope.data;
}

type TUseProjectQueryOptions = {
  enabled?: boolean;
};

export function useProjectQuery(projectId: string, options?: TUseProjectQueryOptions) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => fetchProject(projectId),
    enabled: (options?.enabled ?? true) && Boolean(projectId) && Boolean(token),
  });
}

async function fetchProjectAccess(projectId: string): Promise<TProjectAccess> {
  const envelope = await baseQuery.get<TProjectAccess>(`projects/${projectId}/access`);
  if (!envelope.data?.projectId) {
    throw new Error("Invalid project access payload");
  }
  return envelope.data;
}

type TUseProjectAccessQueryOptions = {
  enabled?: boolean;
};

export function useProjectAccessQuery(projectId: string, options?: TUseProjectAccessQueryOptions) {
  const token = useAccessToken();
  return useQuery({
    queryKey: projectKeys.access(projectId),
    queryFn: () => fetchProjectAccess(projectId),
    enabled: (options?.enabled ?? true) && Boolean(projectId) && Boolean(token),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, companyLogoFile }: TCreateProjectMutationInput) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (companyLogoFile) {
        formData.append("company_logo", companyLogoFile);
      }

      const envelope = await baseQuery.post<CreateProjectResponse>("projects", formData);
      return envelope.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, payload, companyLogoFile }: TUpdateProjectMutationInput) => {
      const formData = new FormData();
      formData.append("data", JSON.stringify(payload));
      if (companyLogoFile) {
        formData.append("company_logo", companyLogoFile);
      }

      const envelope = await baseQuery.patch<TProjectDetail>(`projects/${projectId}`, formData);
      return envelope.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
      void queryClient.invalidateQueries({ queryKey: projectKeys.access(variables.projectId) });
    },
  });
}

type TProjectStatusActionResponse = {
  id: string;
  status: ProjectStatus;
};

type TProjectStatusActionInput = {
  projectId: string;
  action: TProjectStatusAction;
};

async function postProjectStatusAction({
  projectId,
  action,
}: TProjectStatusActionInput): Promise<{ data: TProjectStatusActionResponse; message: string | null }> {
  const envelope = await baseQuery.post<TProjectStatusActionResponse>(`projects/${projectId}/${action}`);
  return { data: envelope.data, message: envelope.message };
}

export function useProjectStatusActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postProjectStatusAction,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const envelope = await baseQuery.delete<null>(`projects/${projectId}`);
      return { projectId, message: envelope.message };
    },
    onSuccess: (_data, projectId) => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
      void queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });
      void queryClient.removeQueries({ queryKey: projectKeys.access(projectId) });
    },
  });
}

export type { TProjectStatusAction } from "@/lib/projects/project-card-actions.utils";

export type TEnrollProjectInLensResponse = {
  lensEnrolled: boolean;
  alreadyEnrolled: boolean;
  firstRunQueued: boolean;
};

/** Super admin only. Enrolls an active project in Lens; Lens queues the first audit in the background. */
export function useEnrollProjectInLensMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const envelope = await baseQuery.post<TEnrollProjectInLensResponse>(`projects/${projectId}/lens/enroll`);
      return envelope.data;
    },
    onSuccess: () => {
      // The enrollment flag lives on the project record: refresh lists, details and access so the Lens nav updates.
      void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
