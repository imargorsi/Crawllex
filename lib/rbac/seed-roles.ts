import {
  INTEGRATION_PERMISSION_ACTIONS,
  integrationPermission,
  isKnownPermission,
  LEAD_DEFAULT_ROLE_ACTIONS,
  leadPermission,
  REPORT_PERMISSION_ACTIONS,
  reportPermission,
} from "@/lib/rbac/permission-catalog";
import { PROJECT_OWNER_ROLE, PROJECT_USER_ROLE, SYSTEM_ROLE_SEEDS } from "@/lib/rbac/roles";
import { purgeHiddenAdminRoles } from "@/lib/rbac/purge-hidden-admin-roles";
import { Role } from "@/models/Role";

/** Process-local memo so existing DBs pick up catalog backfills without requiring `npm run seed` on every deploy. */
let ensurePromise: Promise<void> | null = null;

/**
 * Runs {@link seedSystemRoles} once per process (retries after failure).
 * Call from project-access paths so Integrations / Leads backfill applies before permission checks.
 */
export async function ensureSystemRoles(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = seedSystemRoles().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }
  await ensurePromise;
}

/**
 * Ensures system role templates exist.
 * - Insert: full seed including permissions.
 * - Update: identity fields only — do not clobber admin-edited permissions on custom roles.
 * - System roles: add-only backfill for Integrations + Leads defaults (never $pull mutate keys —
 *   super_admin may grant leads.create|update|delete|import on owner/user and that must stick).
 * - All roles: strip permission strings removed from the locked catalog (e.g. after a matrix trim).
 */
export async function seedSystemRoles(): Promise<void> {
  await purgeHiddenAdminRoles();

  for (const seed of SYSTEM_ROLE_SEEDS) {
    for (const permission of seed.permissions) {
      if (!isKnownPermission(permission)) {
        throw new Error(`Unknown permission in seed for ${seed.slug}: ${permission}`);
      }
    }

    await Role.findOneAndUpdate(
      { slug: seed.slug },
      {
        $set: {
          slug: seed.slug,
          name: seed.name,
          description: seed.description,
          scope: seed.scope,
          isSystem: seed.isSystem,
        },
        $setOnInsert: {
          permissions: seed.permissions,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  const ownerIntegrations = INTEGRATION_PERMISSION_ACTIONS.map((action) =>
    integrationPermission(action),
  );
  const leadDefaults = LEAD_DEFAULT_ROLE_ACTIONS.map((action) => leadPermission(action));
  const ownerReports = REPORT_PERMISSION_ACTIONS.map((action) => reportPermission(action));

  await Role.updateOne(
    { slug: PROJECT_OWNER_ROLE },
    {
      $addToSet: {
        permissions: { $each: [...ownerIntegrations, ...leadDefaults, ...ownerReports] },
      },
    },
  );
  await Role.updateOne(
    { slug: PROJECT_USER_ROLE },
    {
      $addToSet: {
        permissions: {
          $each: [integrationPermission("view"), ...leadDefaults, reportPermission("view")],
        },
      },
    },
  );

  // Drop catalog-removed keys so role edit saves are not blocked after a matrix trim.
  const roles = await Role.find({}).select("_id permissions");
  for (const role of roles) {
    const next = role.permissions.filter((permission) => isKnownPermission(permission));
    if (next.length !== role.permissions.length) {
      role.permissions = next;
      await role.save();
    }
  }
}
