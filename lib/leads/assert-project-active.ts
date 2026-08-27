import { Project } from "@/models";
import { ValidationError } from "@/lib/api/http-errors";

export async function assertProjectActiveForLeads(
  projectId: string,
  inactiveMessage = "Project must be active to add leads.",
): Promise<void> {
  const project = await Project.findById(projectId).select("status");
  if (!project) {
    throw new ValidationError({ projectId: ["Project not found."] }, "Project not found.");
  }
  if (project.status !== "active") {
    throw new ValidationError({ projectId: [inactiveMessage] }, inactiveMessage);
  }
}
