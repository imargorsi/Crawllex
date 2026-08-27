import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { ValidationError } from "@/lib/api/http-errors";
import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { assertProjectActiveForLeads } from "@/lib/leads/assert-project-active";
import { LEAD_DUPLICATE_MESSAGE } from "@/lib/leads/constants";
import { normalizeLeadEmail, normalizeLeadPhone } from "@/lib/leads/normalize";
import { serializeLead } from "@/lib/leads/serialize-lead";
import { isDuplicateKeyError } from "@/lib/roles/role-mutation.utils";
import { Lead, type LeadDocument } from "@/models";
import type { CreateLeadInput } from "@/schemas/lead";

export async function findDuplicateLead(
  projectId: string,
  normalizedEmail: string,
  normalizedPhone: string,
  excludeLeadId?: string,
): Promise<LeadDocument | null> {
  const filter: Record<string, unknown> = {
    projectId,
    normalizedEmail,
    normalizedPhone,
  };
  if (excludeLeadId) {
    filter._id = { $ne: excludeLeadId };
  }
  return Lead.findOne(filter);
}

export async function createLead(
  auth: AuthContext,
  projectId: string,
  input: CreateLeadInput,
): Promise<{ lead: LeadDocument }> {
  await assertProjectActiveForLeads(projectId);

  const normalizedEmail = normalizeLeadEmail(input.email);
  const normalizedPhone = normalizeLeadPhone(input.phone);

  const duplicate = await findDuplicateLead(projectId, normalizedEmail, normalizedPhone);
  if (duplicate) {
    throw new ValidationError({ email: [LEAD_DUPLICATE_MESSAGE] }, LEAD_DUPLICATE_MESSAGE);
  }

  const userId = auth.user._id as Types.ObjectId;
  try {
    const lead = await Lead.create({
      projectId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      servicesInterestedIn: input.servicesInterestedIn,
      message: input.message,
      leadDate: input.leadDate,
      extras: {},
      normalizedEmail,
      normalizedPhone,
      origin: "manual",
      createdBy: userId,
      updatedBy: userId,
    });
    return { lead };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ValidationError({ email: [LEAD_DUPLICATE_MESSAGE] }, LEAD_DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

export function buildCreateLeadResponse(lead: LeadDocument): NextResponse {
  return ApiResponse.success(serializeLead(lead), "Lead created.", 201);
}
