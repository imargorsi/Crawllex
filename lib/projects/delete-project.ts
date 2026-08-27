import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { NotFoundError, ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { projectDeletedMailContent } from "@/lib/mail/client";
import { deleteStoredProjectLogo } from "@/lib/projects/project-logo-storage";
import {
  projectListUrl,
  resolveProjectOwnerEmail,
  sendProjectOwnerMail,
} from "@/lib/projects/send-project-owner-mail";
import { Lead, LeadSource, Project, ProjectIntegration, ProjectMember, SeoActivity, type ProjectDocument } from "@/models";

async function findProjectOrThrow(projectId: string): Promise<ProjectDocument> {
  if (!mongoose.isValidObjectId(projectId)) {
    throw new NotFoundError("Project");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project");
  }

  return project;
}

/**
 * Hard-delete a project. Allowed only when status is `inactive` or `rejected`.
 * Cascades members, SEO activities, leads, lead sources, Google integrations, and removes the stored logo.
 * Emails the owner after a successful delete (soft-fail SMTP).
 */
export async function deleteProject(_auth: AuthContext, projectId: string): Promise<void> {
  const project = await findProjectOrThrow(projectId);

  if (project.status !== "inactive" && project.status !== "rejected") {
    throw new ValidationError(
      { status: ["Only inactive or rejected projects can be deleted."] },
      "Project cannot be deleted in its current state.",
    );
  }

  const businessName = project.businessName;
  const ownerEmail = await resolveProjectOwnerEmail(project).catch(() => null);
  const logoPath = project.logoImage;
  const id = project._id;

  await ProjectMember.deleteMany({ projectId: id });
  await SeoActivity.deleteMany({ projectId: id });
  await Lead.deleteMany({ projectId: id });
  await LeadSource.deleteMany({ projectId: id });
  await ProjectIntegration.deleteMany({ projectId: id });
  await Project.deleteOne({ _id: id });
  await deleteStoredProjectLogo(logoPath).catch(() => undefined);

  if (ownerEmail) {
    const mail = projectDeletedMailContent({
      projectName: businessName,
      projectsUrl: projectListUrl(),
    });
    await sendProjectOwnerMail({
      project,
      to: ownerEmail,
      mail,
      logLabel: "project-delete",
    });
  }
}

export function buildDeleteProjectResponse(): NextResponse {
  return ApiResponse.success(null, "Project deleted.");
}
