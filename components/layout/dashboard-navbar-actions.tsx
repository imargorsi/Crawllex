"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceToggle } from "@/components/layout/workspace-toggle";
import { dashboardNavIconClass } from "@/lib/frontend/layout/dashboard-chrome";

export function DashboardNavbarActions() {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <WorkspaceToggle />
      <ThemeToggle tone="ghost" size="sm" className={dashboardNavIconClass} />
      <LanguageSwitcher tone="ghost" size="sm" />
    </div>
  );
}
