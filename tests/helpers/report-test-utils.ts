import { hashPassword } from "@/lib/auth/password";
import { createProject } from "@/lib/projects/create-project";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, User } from "@/models";
import { authContextFor, projectInput } from "@/tests/helpers/project-test-utils";

/** Creates an owner and an active project with system roles, for report tests. */
export async function seedProject() {
  await seedSystemRoles();
  const owner = await User.create({
    name: "Report Owner",
    email: "report-owner@example.com",
    password: await hashPassword("password"),
    emailVerifiedAt: new Date(),
    roles: [],
  });
  const { project } = await createProject(
    authContextFor(owner),
    projectInput({ businessName: "Silver Foundation", websiteUrl: "https://silver.example.com" }),
  );
  await Project.findByIdAndUpdate(project._id, { status: "active" });
  return { owner, projectId: project._id.toString() };
}
