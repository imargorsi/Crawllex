import type { DashboardBreadcrumbItem } from "@/context/dashboard-breadcrumb-context";

export type BreadcrumbTranslate = (key: string) => string;

const SEGMENT_KEYS: Record<string, string> = {
  dashboard: "home.title",
  users: "modules.users.title",
  projects: "modules.projects.title",
  roles: "modules.roles.title",
  analytics: "modules.analytics.title",
  "seo-activities": "modules.seoActivities.title",
  leads: "modules.leads.title",
  reports: "modules.reports.title",
  settings: "settings.title",
  "edit-profile": "profile.edit.breadcrumbTitle",
  new: "breadcrumb.new",
  edit: "breadcrumb.edit",
};

const CREATE_KEYS: Record<string, string> = {
  users: "modules.users.createUserTitle",
  roles: "modules.roles.createRoleTitle",
  projects: "modules.projects.createProjectTitle",
};

const EDIT_KEYS: Record<string, string> = {
  users: "modules.users.editUserTitle",
  roles: "modules.roles.editRoleTitle",
  projects: "modules.projects.editProjectTitle",
};

function isRouteId(segment: string): boolean {
  return /^[a-f\d]{24}$/i.test(segment) || /^[0-9a-f-]{36}$/i.test(segment);
}

function titleFromSegment(segment: string): string {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function segmentLabel(segment: string, parent: string | undefined, t: BreadcrumbTranslate): string {
  if (segment === "new" && parent && CREATE_KEYS[parent]) return t(CREATE_KEYS[parent]);
  if (segment === "edit" && parent && EDIT_KEYS[parent]) return t(EDIT_KEYS[parent]);

  const key = SEGMENT_KEYS[segment];
  return key ? t(key) : titleFromSegment(segment);
}

export function breadcrumbsFromPathname(pathname: string, t: BreadcrumbTranslate): DashboardBreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return [];

  const items: DashboardBreadcrumbItem[] = [];
  const onDashboardHome = segments.length === 1 && segments[0] === "dashboard";

  if (!onDashboardHome) {
    items.push({ id: "dashboard", label: t("breadcrumb.root"), href: "/dashboard" });
  }

  let path = "";
  let parent: string | undefined;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    path += `/${segment}`;

    if (isRouteId(segment)) continue;

    items.push({
      id: segment,
      label: segmentLabel(segment, parent, t),
      href: i === segments.length - 1 ? undefined : path,
    });

    if (segment !== "new" && segment !== "edit") {
      parent = segment;
    }
  }

  return items;
}
