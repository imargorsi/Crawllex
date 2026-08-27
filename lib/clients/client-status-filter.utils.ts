import {
  isClientStatus,
  type TClientStatus,
} from "@/lib/clients/constants";

export type TClientStatusFilter = TClientStatus | "all";

export type TClientStatusCounts = Record<TClientStatusFilter, number>;

export type TClientStatusFilterLabelKey = TClientStatusFilter;

const EMPTY_COUNTS: TClientStatusCounts = {
  all: 0,
  active: 0,
  inactive: 0,
};

export function parseClientStatusFilter(value: string | string[] | undefined): TClientStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  if (isClientStatus(raw)) return raw;
  return undefined;
}

export function countClientsByStatus(clients: Array<{ status: TClientStatus }>): TClientStatusCounts {
  const counts = { ...EMPTY_COUNTS, all: clients.length };

  for (const client of clients) {
    counts[client.status] += 1;
  }

  return counts;
}
