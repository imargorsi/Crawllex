"use client";

import { useState } from "react";

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopBar } from "@/components/layout/dashboard-top-bar";
import { RequireRouteAccess } from "@/components/auth/route-access-guard";
import { DashboardBreadcrumbProvider } from "@/context/dashboard-breadcrumb-context";
import { ProjectAccessProvider } from "@/context/project-access-context";
import { SelectedProjectProvider } from "@/context/selected-project-context";
import { DashboardSidebarProvider } from "@/context/dashboard-sidebar-context";
import { WorkspaceProvider } from "@/context/workspace-context";
import { useIsAuthRevealing } from "@/context/auth-reveal-transition";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isAuthRevealing = useIsAuthRevealing();

  return (
    <DashboardSidebarProvider
      value={{
        isSidebarOpen,
        setSidebarOpen: setIsSidebarOpen,
        isSidebarCollapsed,
        setSidebarCollapsed: setIsSidebarCollapsed,
        toggleSidebarCollapsed: () => setIsSidebarCollapsed((collapsed) => !collapsed),
      }}
    >
      <DashboardBreadcrumbProvider>
        <SelectedProjectProvider>
          <ProjectAccessProvider>
            <WorkspaceProvider>
              <RequireRouteAccess>
              <div
                className={cn(
                  "flex h-svh flex-col overflow-hidden bg-bg-main md:flex-row",
                  isAuthRevealing && "dashboard-auth-reveal-enter"
                )}
              >
                {isSidebarOpen ? (
                  <div className="dashboard-enter-item dashboard-enter-sidebar shrink-0">
                    <DashboardSidebar onClose={() => setIsSidebarOpen(false)} />
                  </div>
                ) : null}
                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-bg-main">
                  <div className="dashboard-enter-item dashboard-enter-topbar shrink-0">
                    <DashboardTopBar />
                  </div>
                  <main className="dashboard-enter-item dashboard-enter-content flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
              </RequireRouteAccess>
            </WorkspaceProvider>
          </ProjectAccessProvider>
        </SelectedProjectProvider>
      </DashboardBreadcrumbProvider>
    </DashboardSidebarProvider>
  );
}
