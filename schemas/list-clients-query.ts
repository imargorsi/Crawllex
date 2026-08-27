import { z } from "zod";

import { CLIENT_STATUSES } from "@/lib/clients/constants";

export const listClientsQuerySchema = z.object({
  status: z.enum(CLIENT_STATUSES).optional(),
});

export type ListClientsQueryInput = z.infer<typeof listClientsQuerySchema>;

export function parseListClientsQuery(searchParams: URLSearchParams): ListClientsQueryInput {
  const statusParam = searchParams.get("status");
  if (!statusParam) {
    return {};
  }

  return listClientsQuerySchema.parse({ status: statusParam });
}
