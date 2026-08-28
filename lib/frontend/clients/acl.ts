import { hasAnyPermission } from "@/lib/frontend/auth/has-any-permission";

const VIEW = ["clients.view"] as const;
const CREATE = ["clients.create"] as const;
const UPDATE = ["clients.update"] as const;
const DELETE = ["clients.delete"] as const;

export function clientCanView(permissions: readonly string[] | undefined) {
  return hasAnyPermission(permissions, VIEW);
}

export function clientCanCreate(permissions: readonly string[] | undefined) {
  return hasAnyPermission(permissions, CREATE);
}

export function clientCanUpdate(permissions: readonly string[] | undefined) {
  return hasAnyPermission(permissions, UPDATE);
}

export function clientCanDelete(permissions: readonly string[] | undefined) {
  return hasAnyPermission(permissions, DELETE);
}
