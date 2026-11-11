import { ZodError } from "zod";

import { withApiHandler } from "@/lib/api/handler";
import { ApiResponse } from "@/lib/api/response";
import { runApiGuards } from "@/lib/auth/run-api-guards";
import { buildListRolesResponse, listRoles } from "@/lib/roles/list-roles";
import { buildCreateRoleResponse, createRole } from "@/lib/roles/create-role";
import { adminPermission } from "@/lib/rbac/permission-catalog";
import { connectDb } from "@/lib/db/mongoose";
import { parseListRolesQuery } from "@/schemas/list-roles-query";
import { createRoleSchema } from "@/schemas/role";

export const GET = withApiHandler(async (request) => {
  await connectDb();

  const auth = await runApiGuards(request, { permission: adminPermission("roles", "view") });
  if (auth instanceof Response) return auth;

  let query;
  try {
    query = parseListRolesQuery(new URL(request.url).searchParams);
  } catch (error) {
    if (error instanceof ZodError) {
      return ApiResponse.validation("Invalid Query Parameters.", {
        query: error.issues.map((issue) => issue.message),
      });
    }
    throw error;
  }

  const result = await listRoles(query);
  return buildListRolesResponse(result);
});

export const POST = withApiHandler(async (request) => {
  await connectDb();

  const auth = await runApiGuards(request, { permission: adminPermission("roles", "create") });
  if (auth instanceof Response) return auth;

  const input = createRoleSchema.parse(await request.json());
  const { role } = await createRole(input, { roles: auth.user.roles });
  return buildCreateRoleResponse(role);
});
