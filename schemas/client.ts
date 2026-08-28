import { z } from "zod";

import {
  CLIENT_CONTENT_READY,
  CLIENT_EXISTING_SYSTEMS,
  CLIENT_LANGUAGES,
  CLIENT_MOBILE_PLATFORMS,
  CLIENT_PLATFORMS,
  CLIENT_PROJECT_TYPES,
  CLIENT_USER_ROLES,
  CLIENT_WEBSITE_PLATFORMS,
  clientNeedsMobilePlatforms,
  clientNeedsWebsitePlatforms,
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

const optionalWebsiteUrlSchema = z.preprocess((value) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : normalizeWebsiteUrl(trimmed);
}, z.string().max(2048).regex(WEBSITE_URL_PATTERN, "Enter a valid website URL.").nullable().optional());

const requiredPhone = z.string().trim().min(1, "Phone number is required.").max(32);

function toggleArray<T extends string>(values: readonly T[]) {
  return z.array(z.enum(values)).optional();
}

const intakeObject = z.object({
  businessName: displayNameSchema({
    min: 1,
    requiredMessage: "Business name is required.",
  }),
  contactPerson: displayNameSchema({
    min: 1,
    requiredMessage: "Contact person is required.",
  }),
  pocEmail: requiredEmail,
  pocContactNumber: requiredPhone,
  businessSummary: requiredLongText,
  idealCustomerProfile: requiredLongText,
  projectTypes: z.array(z.enum(CLIENT_PROJECT_TYPES)).min(1, "Select at least one project type."),
  platforms: toggleArray(CLIENT_PLATFORMS),
  projectName: displayNameSchema({
    min: 1,
    requiredMessage: "Project name is required.",
  }),
  projectDescription: requiredLongText,
  successLooksLike: requiredLongText,
  existingSystem: z.enum(CLIENT_EXISTING_SYSTEMS),
  websiteUrl: optionalWebsiteUrlSchema,
  changeNotes: optionalLongText,
  launchMustHaves: requiredLongText,
  laterFeatures: optionalLongText,
  userRoles: z.array(z.enum(CLIENT_USER_ROLES)).min(1, "Select at least one user role."),
  languages: z.array(z.enum(CLIENT_LANGUAGES)).min(1, "Select at least one language."),
  rtlRequired: z.boolean(),
  expectedLaunchDate: z.preprocess((value) => {
    if (value == null) return null;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").nullable().optional()),
  hasFixedDeadline: z.boolean(),
  contentReady: z.enum(CLIENT_CONTENT_READY),
  requirementsConfirmed: z.boolean(),
});

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

  const platforms = data.platforms ?? [];

  if (clientNeedsWebsitePlatforms(data.projectTypes)) {
    const hasWebsitePlatform = platforms.some((platform) =>
      (CLIENT_WEBSITE_PLATFORMS as readonly string[]).includes(platform),
    );
    if (!hasWebsitePlatform) {
      ctx.addIssue({
        code: "custom",
        path: ["platforms"],
        message: "Select at least one website platform.",
      });
    }
  }

  if (clientNeedsMobilePlatforms(data.projectTypes)) {
    const hasMobilePlatform = platforms.some((platform) =>
      (CLIENT_MOBILE_PLATFORMS as readonly string[]).includes(platform),
    );
    if (!hasMobilePlatform) {
      ctx.addIssue({
        code: "custom",
        path: ["platforms"],
        message: "Select Android, iOS, or both.",
      });
    }
  }
}

/** POST /api/v1/clients — request body. */
export const createClientSchema = intakeObject.superRefine((data, ctx) => refineIntake(data, ctx, true));

export type CreateClientInput = z.infer<typeof createClientSchema>;

/** PATCH /api/v1/clients/{id} — partial body. Share token is never rotated from this schema. */
export const updateClientSchema = intakeObject.partial();

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
