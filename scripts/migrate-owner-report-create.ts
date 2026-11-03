/**
 * One-time migration: remove `reports.create` from the `project_owner` system role.
 * Creating reports is no longer a default. Admins grant it to the roles that need it.
 *
 * Run: npm run migrate:owner-report-create (local) or npm run migrate:prod:owner-report-create (production)
 */
import mongoose from "mongoose";

import { connectDb } from "../lib/db/mongoose";
import { PROJECT_OWNER_ROLE } from "../lib/rbac/roles";
import { reportPermission } from "../lib/rbac/permission-catalog";
import { Role } from "../models";

async function main() {
  await connectDb();

  const result = await Role.updateOne(
    { slug: PROJECT_OWNER_ROLE },
    { $pull: { permissions: reportPermission("create") } },
  );

  console.log(`project_owner: removed reports.create (modified=${result.modifiedCount}).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
