import type { TLeadOrigin } from "@/types/lead.types";

export type TLeadSourceGroup = "wordpress" | "others";

/** Table/export grouping: plugin ingest vs CSV/manual. */
export function leadSourceGroup(origin: TLeadOrigin): TLeadSourceGroup {
  return origin === "wordpress" ? "wordpress" : "others";
}
