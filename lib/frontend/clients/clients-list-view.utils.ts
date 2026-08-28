export const CLIENT_LIST_VIEW_MODES = ["cards", "table"] as const;

export type TClientListViewMode = (typeof CLIENT_LIST_VIEW_MODES)[number];

export const DEFAULT_CLIENT_LIST_VIEW_MODE: TClientListViewMode = "cards";

export function parseClientListViewMode(value: unknown): TClientListViewMode {
  if (typeof value === "string" && value === "table") return "table";
  return DEFAULT_CLIENT_LIST_VIEW_MODE;
}
