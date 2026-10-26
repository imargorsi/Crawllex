import { z } from "zod";

import { ValidationError } from "@/lib/api/http-errors";
import { SEO_ACTIVITY_TYPES } from "@/lib/seo-activities/constants";
import { parseGoogleDocId } from "@/lib/seo-activities/google-doc-url";
import { sanitizeHttpUrl } from "@/lib/seo-activities/sanitize-url";
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MAX_MESSAGE,
} from "@/lib/validation/display-name";
import type { TSeoActivityType } from "@/types/seo-activity.types";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter A Valid Date.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year!, month! - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month! - 1 &&
      date.getDate() === day
    );
  }, "Enter A Valid Date.");

const httpUrlSchema = z
  .string()
  .trim()
  .min(1, "Url Is Required.")
  .refine((value) => Boolean(sanitizeHttpUrl(value)), "Enter A Valid Http Or Https Url.")
  .transform((value) => sanitizeHttpUrl(value)!);

const contentFields = {
  url: httpUrlSchema,
  occurredOn: isoDateSchema,
  title: z.string().trim().max(DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MAX_MESSAGE).optional(),
  anchorText: z.string().trim().optional(),
  details: z.string().trim().optional(),
};

function refineTypeSpecificFields(
  data: {
    title?: string;
    anchorText?: string;
    details?: string;
  },
  ctx: z.RefinementCtx,
  type: TSeoActivityType,
) {
  if (type === "blogs") {
    if (!data.title || data.title.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "Title Must Be At Least 3 Characters.",
      });
    }
    return;
  }

  if (type === "backlinks") {
    if (!data.anchorText || data.anchorText.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anchorText"],
        message: "Anchor Text Must Be At Least 2 Characters.",
      });
    }
    return;
  }

  if (!data.details || data.details.length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["details"],
      message: "Details Must Be At Least 4 Characters.",
    });
  }
}

/**
 * Create accepts an optional WordPress push for blogs. When pushing, the post's URL comes from WordPress,
 * so the url field is not required.
 */
export const createSeoActivitySchema = z
  .object({
    type: z.enum(SEO_ACTIVITY_TYPES),
    url: z.string().trim().optional(),
    occurredOn: isoDateSchema,
    title: contentFields.title,
    anchorText: contentFields.anchorText,
    details: contentFields.details,
    pushToWordpress: z.boolean().optional(),
    docUrl: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    refineTypeSpecificFields(data, ctx, data.type);

    if (data.pushToWordpress) {
      if (data.type !== "blogs") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["pushToWordpress"],
          message: "Only blog posts can be pushed to WordPress.",
        });
      } else if (!data.docUrl || !parseGoogleDocId(data.docUrl)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["docUrl"],
          message: "Enter A Google Docs Link (docs.google.com/document/d/...).",
        });
      }
      return;
    }

    if (!data.url) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["url"], message: "Url Is Required." });
    } else if (!sanitizeHttpUrl(data.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url"],
        message: "Enter A Valid Http Or Https Url.",
      });
    }
  })
  .transform((data) => {
    const { url, docUrl, ...rest } = data;
    return {
      ...rest,
      ...(url ? { url: sanitizeHttpUrl(url) ?? undefined } : {}),
      ...(docUrl ? { docUrl: docUrl.trim() } : {}),
    };
  });

export type CreateSeoActivityInput = z.infer<typeof createSeoActivitySchema>;

export type UpdateSeoActivityInput = {
  url: string;
  occurredOn: string;
  title?: string;
  anchorText?: string;
  details?: string;
};

export function parseUpdateSeoActivityInput(
  activityType: TSeoActivityType,
  body: unknown,
): UpdateSeoActivityInput {
  const schema = z
    .object({
      type: z.literal(activityType).optional(),
      ...contentFields,
    })
    .superRefine((data, ctx) => {
      refineTypeSpecificFields(data, ctx, activityType);
    });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] ? String(issue.path[0]) : "body";
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    throw ValidationError.fromFieldErrors(fieldErrors);
  }

  return {
    url: parsed.data.url,
    occurredOn: parsed.data.occurredOn,
    title: parsed.data.title,
    anchorText: parsed.data.anchorText,
    details: parsed.data.details,
  };
}
