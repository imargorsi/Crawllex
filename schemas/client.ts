import { z } from "zod";

import {
  CLIENT_FEATURE_NAME_MAX,
  CLIENT_FEATURE_WHAT_MAX,
  CLIENT_FEATURE_WHAT_MIN,
  CLIENT_INTEGRATIONS,
  CLIENT_MAX_FEATURES,
  CLIENT_MAX_LINKS,
  CLIENT_MOBILE_PLATFORMS,
  CLIENT_OTHER_MAX,
  CLIENT_PROJECT_TYPES,
  CLIENT_WEB_APP_TYPES,
  CLIENT_WEBSITE_FOCUS,
  clientNeedsIntegrationOther,
  clientNeedsMobilePlatforms,
  clientNeedsProjectTypeOther,
  clientNeedsWebAppTypeOther,
  clientNeedsWebAppTypes,
  clientNeedsWebsiteFocus,
} from "@/lib/clients/intake-constants";
import { WEBSITE_URL_PATTERN, normalizeWebsiteUrl } from "@/lib/projects/website-url.utils";
import { displayNameSchema } from "@/lib/validation/display-name";

const optionalLongText = z.string().trim().max(4000).optional().nullable();
const requiredLongText = z.string().trim().min(1, "This field is required.").max(4000);

const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email address is required.")
  .max(255)
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const requiredPhone = z.string().trim().min(1, "Phone number is required.").max(32);

const optionalOtherText = z.string().trim().max(CLIENT_OTHER_MAX).optional().nullable();

const featureRowSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(CLIENT_FEATURE_NAME_MAX),
  whatItDoes: z
    .string()
    .trim()
    .min(CLIENT_FEATURE_WHAT_MIN, "Use at least 10 characters.")
    .max(CLIENT_FEATURE_WHAT_MAX),
});

const linkRowSchema = z.object({
  linkName: z.string().trim().min(2, "Use at least 2 characters.").max(CLIENT_OTHER_MAX),
  url: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? trimmed : normalizeWebsiteUrl(trimmed);
  }, z.string().min(1, "This field is required.").max(2048).regex(WEBSITE_URL_PATTERN, "Enter a valid URL.")),
});

const intakeObject = z.object({
  businessName: displayNameSchema({
    min: 2,
    requiredMessage: "Business name is required.",
  }),
  contactPerson: displayNameSchema({
    min: 2,
    requiredMessage: "Contact person is required.",
  }),
  pocEmail: requiredEmail,
  pocContactNumber: requiredPhone,
  businessSummary: requiredLongText,
  idealCustomerProfile: requiredLongText,
  projectDescription: requiredLongText,
  projectTypes: z.array(z.enum(CLIENT_PROJECT_TYPES)).min(1, "Select at least one project type."),
  projectTypeOther: optionalOtherText,
  websiteFocus: z.array(z.enum(CLIENT_WEBSITE_FOCUS)).optional(),
  mobilePlatforms: z.array(z.enum(CLIENT_MOBILE_PLATFORMS)).optional(),
  webAppTypes: z.array(z.enum(CLIENT_WEB_APP_TYPES)).optional(),
  webAppTypeOther: optionalOtherText,
  features: z
    .array(featureRowSchema)
    .min(1, "Add at least one feature.")
    .max(CLIENT_MAX_FEATURES, "You can add up to 5 features."),
  integrations: z.array(z.enum(CLIENT_INTEGRATIONS)).optional(),
  integrationOther: optionalOtherText,
  links: z.array(linkRowSchema).max(CLIENT_MAX_LINKS, "You can add up to 10 links.").optional(),
  notes: optionalLongText,
  expectedLaunchDate: z.preprocess((value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").nullable().optional()),
  launchMustHaves: requiredLongText,
  requirementsConfirmed: z.boolean(),
});

function otherTextIsValid(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length >= 2);
}

function refineIntake(
  data: z.infer<typeof intakeObject>,
  ctx: z.RefinementCtx,
  requireConfirmation: boolean,
) {
  if (requireConfirmation && !data.requirementsConfirmed) {
    ctx.addIssue({
      code: "custom",
      path: ["requirementsConfirmed"],
      message: "Confirm that the information is accurate.",
    });
  }

  if (clientNeedsProjectTypeOther(data.projectTypes) && !otherTextIsValid(data.projectTypeOther)) {
    ctx.addIssue({
      code: "custom",
      path: ["projectTypeOther"],
      message: "Please specify what we are building.",
    });
  }

  if (clientNeedsWebsiteFocus(data.projectTypes) && !(data.websiteFocus?.length)) {
    ctx.addIssue({
      code: "custom",
      path: ["websiteFocus"],
      message: "Select at least one website focus.",
    });
  }

  if (clientNeedsMobilePlatforms(data.projectTypes) && !(data.mobilePlatforms?.length)) {
    ctx.addIssue({
      code: "custom",
      path: ["mobilePlatforms"],
      message: "Select at least one mobile platform.",
    });
  }

  if (clientNeedsWebAppTypes(data.projectTypes) && !(data.webAppTypes?.length)) {
    ctx.addIssue({
      code: "custom",
      path: ["webAppTypes"],
      message: "Select at least one web app type.",
    });
  }

  if (clientNeedsWebAppTypeOther(data.webAppTypes ?? []) && !otherTextIsValid(data.webAppTypeOther)) {
    ctx.addIssue({
      code: "custom",
      path: ["webAppTypeOther"],
      message: "Please specify the web app type.",
    });
  }

  if (clientNeedsIntegrationOther(data.integrations ?? []) && !otherTextIsValid(data.integrationOther)) {
    ctx.addIssue({
      code: "custom",
      path: ["integrationOther"],
      message: "Please specify the other API.",
    });
  }
}

/** POST /api/v1/clients — request body. */
export const createClientSchema = intakeObject.superRefine((data, ctx) => refineIntake(data, ctx, true));

export type CreateClientInput = z.infer<typeof createClientSchema>;

/** PATCH /api/v1/clients/{id} — full intake body (same conditionals as create). */
export const updateClientSchema = intakeObject
  .extend({
    retainedFileIds: z.array(z.string().min(1)).max(10).optional(),
  })
  .superRefine((data, ctx) => refineIntake(data, ctx, true));

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
