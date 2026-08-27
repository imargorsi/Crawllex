import { NextResponse } from "next/server";
import mongoose from "mongoose";

import { ApiResponse } from "@/lib/api/response";
import { ValidationError } from "@/lib/api/http-errors";
import type { AuthContext } from "@/lib/auth/guards";
import { projectCreatedMailContent } from "@/lib/mail/client";
import { assignProjectMember } from "@/lib/projects/assign-member";
import { PENDING_PROJECT_LIMIT_MESSAGE } from "@/lib/projects/constants";
import { mapCreateProjectFields } from "@/lib/projects/project-field-map.utils";
import { projectListUrl, sendProjectOwnerMail } from "@/lib/projects/send-project-owner-mail";
import { userOwnsPendingProject } from "@/lib/projects/user-owns-pending-project";
import { serializeProject } from "@/lib/serializers/project";
import { PROJECT_OWNER_ROLE, SUPER_ADMIN_ROLE } from "@/lib/rbac/roles";
import { seedSystemRoles } from "@/lib/rbac/seed-roles";
import { Project, User, type ProjectDocument } from "@/models";
import type { CreateProjectInput } from "@/schemas/project";

function isDuplicateKeyError(error: unknown): boolean {
  return error instanceof Error && (error as Error & { code?: number }).code === 11000;
}

function pendingProjectLimitError(): ValidationError {
  return new ValidationError({ status: [PENDING_PROJECT_LIMIT_MESSAGE] }, PENDING_PROJECT_LIMIT_MESSAGE);
}

type CreateActors = {
  ownerUserId: mongoose.Types.ObjectId;
  pocEmail: string;
};

async function resolveCreateActors(auth: AuthContext, input: CreateProjectInput): Promise<CreateActors> {
  const isAdmin = auth.user.roles.includes(SUPER_ADMIN_ROLE);

  if (!isAdmin) {
    if (input.ownerUserId) {
      throw ValidationError.fromFieldErrors({
        ownerUserId: ["Only platform admins can assign a project owner."],
      });
    }

    return {
      ownerUserId: auth.user._id,
      pocEmail: auth.user.email.toLowerCase(),
    };
  }

  if (!input.ownerUserId) {
    throw ValidationError.fromFieldErrors({
      ownerUserId: ["Owner is required when creating a project as admin."],
    });
  }

  if (!mongoose.Types.ObjectId.isValid(input.ownerUserId)) {
    throw ValidationError.fromFieldErrors({
      ownerUserId: ["The selected owner is invalid."],
    });
  }

  const owner = await User.findById(input.ownerUserId);
  if (!owner) {
    throw ValidationError.fromFieldErrors({
      ownerUserId: ["The selected owner does not exist."],
    });
  }

  if (!owner.hasVerifiedEmail()) {
    throw ValidationError.fromFieldErrors({
      ownerUserId: ["The selected owner must have a verified email."],
    });
  }

  return {
    ownerUserId: owner._id,
    pocEmail: owner.email.toLowerCase(),
  };
}

export async function createProject(
  auth: AuthContext,
  input: CreateProjectInput,
  options?: { logoImage?: string | null },
): Promise<{ project: ProjectDocument }> {
  await seedSystemRoles();

  const isAdmin = auth.user.roles.includes(SUPER_ADMIN_ROLE);
  const { ownerUserId, pocEmail } = await resolveCreateActors(auth, input);
  const onboarding = mapCreateProjectFields(input);

  if (!isAdmin && (await userOwnsPendingProject(auth.user._id))) {
    throw pendingProjectLimitError();
  }

  let project: ProjectDocument;
  try {
    project = await Project.create({
      ...onboarding,
      logoImage: options?.logoImage ?? null,
      pocEmail,
      status: isAdmin ? "active" : "pending",
      createdByUserId: ownerUserId,
      approvedAt: isAdmin ? new Date() : null,
      approvedByUserId: isAdmin ? auth.user._id : null,
    });
  } catch (error) {
    if (!isAdmin && isDuplicateKeyError(error)) {
      throw pendingProjectLimitError();
    }
    throw error;
  }

  await assignProjectMember({
    projectId: project._id,
    userId: ownerUserId,
    roleSlug: PROJECT_OWNER_ROLE,
  });

  const mail = projectCreatedMailContent({
    projectName: project.businessName,
    status: project.status === "active" ? "active" : "pending",
    projectsUrl: projectListUrl(),
  });
  await sendProjectOwnerMail({
    project,
    to: pocEmail,
    mail,
    logLabel: "project-create",
  });

  return { project };
}

export function buildCreateProjectResponse(project: ProjectDocument): NextResponse {
  return ApiResponse.success(serializeProject(project), "Project created.", 201);
}
