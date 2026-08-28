"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthUserQuery } from "@/features/auth/auth.api";
import {
  DEFAULT_DASHBOARD_WORKSPACE,
  defaultPathForWorkspace,
  readStoredWorkspace,
  resolveDashboardWorkspace,
  type TDashboardWorkspace,
  workspaceFromPathname,
  writeStoredWorkspace,
} from "@/lib/frontend/layout/workspace";
import { isSuperAdmin } from "@/lib/rbac/access";

type TWorkspaceContextValue = {
  workspace: TDashboardWorkspace;
  canSwitchWorkspace: boolean;
  setWorkspace: (workspace: TDashboardWorkspace) => void;
};

const WorkspaceContext = createContext<TWorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useAuthUserQuery();
  const canSwitchWorkspace = Boolean(user && isSuperAdmin(user.roles));
  const [storedWorkspace, setStoredWorkspace] = useState<TDashboardWorkspace>(DEFAULT_DASHBOARD_WORKSPACE);
  const [optimisticWorkspace, setOptimisticWorkspace] = useState<TDashboardWorkspace | null>(null);

  useEffect(() => {
    setStoredWorkspace(readStoredWorkspace());
  }, []);

  const pathWorkspace = workspaceFromPathname(pathname);

  useEffect(() => {
    if (!canSwitchWorkspace) {
      setOptimisticWorkspace(null);
      return;
    }

    if (pathWorkspace) {
      writeStoredWorkspace(pathWorkspace);
      setStoredWorkspace(pathWorkspace);
      setOptimisticWorkspace(null);
    }
  }, [canSwitchWorkspace, pathWorkspace]);

  const workspace = resolveDashboardWorkspace({
    pathname,
    stored: storedWorkspace,
    canSwitchWorkspace,
    optimistic: optimisticWorkspace,
  });

  const value = useMemo<TWorkspaceContextValue>(
    () => ({
      workspace,
      canSwitchWorkspace,
      setWorkspace: (next) => {
        if (!canSwitchWorkspace) return;
        writeStoredWorkspace(next);
        setStoredWorkspace(next);
        setOptimisticWorkspace(next);
        if (pathWorkspace !== next) {
          router.push(defaultPathForWorkspace(next));
        }
      },
    }),
    [canSwitchWorkspace, pathWorkspace, router, workspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): TWorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    return {
      workspace: DEFAULT_DASHBOARD_WORKSPACE,
      canSwitchWorkspace: false,
      setWorkspace: () => undefined,
    };
  }
  return context;
}
