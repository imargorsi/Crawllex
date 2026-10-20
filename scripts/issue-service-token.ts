/**
 * Staging-only: issue a non-expiring service token for an integration (Crawllex Lens).
 *
 * Refuses to run unless CRAWLEX_SERVICE_TOKENS_ENABLED=true and APP_URL is the staging host.
 *
 * Issue:
 *   npm run service-token:issue -- --email lens-agent@example.com --project <projectId> --name crawllex-lens
 * Revoke:
 *   npm run service-token:revoke -- --id <accessTokenId>
 */
import fs from "fs/promises";
import mongoose from "mongoose";

import { connectDb } from "../lib/db/mongoose";
import { createServiceAccessToken, serviceTokensEnabled } from "../lib/auth/tokens";
import { AccessToken, ProjectMember, Role, User } from "../models";

const STAGING_HOST = "crawllex-dev.vercel.app";
const SERVICE_ROLE_SLUG = "project_user";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function assertStaging(): void {
  if (!serviceTokensEnabled()) {
    throw new Error("CRAWLEX_SERVICE_TOKENS_ENABLED is not true. Refusing.");
  }
  const appUrl = process.env.APP_URL ?? "";
  if (new URL(appUrl).hostname !== STAGING_HOST) {
    throw new Error(`APP_URL must be https://${STAGING_HOST}. Refusing.`);
  }
}

async function issue(email: string, projectId: string, name: string): Promise<void> {
  const role = await Role.findOne({ slug: SERVICE_ROLE_SLUG }).lean();
  if (!role) throw new Error(`Role ${SERVICE_ROLE_SLUG} not found.`);

  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name: name,
      email: email.toLowerCase(),
      password: null,
      emailVerifiedAt: new Date(),
      roles: [],
      status: "active",
      accountSource: "admin",
    });
    console.log(`Created service user ${user.email} (${user._id}).`);
  }

  await ProjectMember.updateOne(
    { projectId: new mongoose.Types.ObjectId(projectId), userId: user._id },
    {
      $setOnInsert: { roleId: role._id, status: "active", invitedByUserId: null },
    },
    { upsert: true },
  );

  const token = await createServiceAccessToken(user._id, name);
  const out = arg("out");
  if (!out) throw new Error("Pass --out <file> so the token is written to a 0600 file, not printed.");
  await fs.writeFile(out, `${token}\n`, { mode: 0o600 });
  await fs.chmod(out, 0o600);
  console.log(`Token written to ${out} (0600). Token id: ${token.split("|")[0]}`);
}

async function revoke(id: string): Promise<void> {
  if (!mongoose.isValidObjectId(id)) throw new Error("Invalid token id.");
  const result = await AccessToken.deleteOne({ _id: id, serviceToken: true });
  console.log(result.deletedCount ? `Revoked ${id}.` : `No service token ${id}.`);
}

async function main() {
  assertStaging();
  await connectDb();

  const revokeId = arg("id");
  if (revokeId) {
    await revoke(revokeId);
    return;
  }

  const email = arg("email");
  const project = arg("project");
  if (!email || !project || !mongoose.isValidObjectId(project)) {
    throw new Error("Usage: --email <address> --project <projectId> --out <file> [--name <label>]");
  }
  await issue(email, project, arg("name") ?? "crawllex-lens");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
