import { NextResponse } from "next/server";
import type { Types } from "mongoose";

import { ApiResponse } from "@/lib/api/response";
import type { AuthContext } from "@/lib/auth/guards";
import { publishBlogDraft } from "@/lib/seo-activities/publish-blog-draft";
import { serializeSeoActivity } from "@/lib/seo-activities/serialize-seo-activity";
import { SeoActivity, type SeoActivityDocument } from "@/models";
import type { CreateSeoActivityInput } from "@/schemas/seo-activity";

function typeSpecificFields(input: CreateSeoActivityInput) {
  if (input.type === "blogs") {
    return {
      title: input.title!.trim(),
      anchorText: null,
      details: null,
    };
  }

  if (input.type === "backlinks") {
    return {
      title: null,
      anchorText: input.anchorText!.trim(),
      details: null,
    };
  }

  return {
    title: null,
    anchorText: null,
    details: input.details!.trim(),
  };
}

export async function createSeoActivity(
  auth: AuthContext,
  projectId: string,
  input: CreateSeoActivityInput,
): Promise<{ activity: SeoActivityDocument }> {
  const userId = auth.user._id as Types.ObjectId;

  // The push runs first. If it fails, nothing is saved and the user can retry.
  const wordpress =
    input.type === "blogs" && input.pushToWordpress && input.docUrl
      ? await publishBlogDraft(projectId, { title: input.title!.trim(), docUrl: input.docUrl })
      : null;

  const activity = await SeoActivity.create({
    projectId,
    activityType: input.type,
    url: wordpress ? wordpress.link : input.url,
    occurredOn: input.occurredOn,
    ...typeSpecificFields(input),
    docUrl: wordpress ? input.docUrl : null,
    pushedToWordpress: Boolean(wordpress),
    wpPostId: wordpress ? wordpress.postId : null,
    wpPostLink: wordpress ? wordpress.link : null,
    wpPushedAt: wordpress ? wordpress.pushedAt : null,
    createdBy: userId,
    updatedBy: userId,
  });

  return { activity };
}

export function buildCreateSeoActivityResponse(activity: SeoActivityDocument): NextResponse {
  return ApiResponse.success(serializeSeoActivity(activity), "Activity created.", 201);
}
