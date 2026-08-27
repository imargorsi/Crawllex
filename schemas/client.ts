import { z } from "zod";

import { SEO_GOALS } from "@/lib/projects/constants";
import { WEBSITE_URL_PATTERN, normalizeWebsiteUrl } from "@/lib/projects/website-url.utils";
import { displayNameSchema } from "@/lib/validation/display-name";

const optionalText = z.string().trim().max(2000).optional().nullable();
const optionalShortText = z.string().trim().max(255).optional().nullable();
const optionalEmail = z.preprocess((value) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().max(255).email("Enter A Valid Email Address.").nullable().optional());

const stringListSchema = z.array(z.string().trim().min(1).max(255)).optional().default([]);
const competitorListSchema = z.array(z.string().trim().min(1).max(2048)).optional().default([]);

const websiteUrlSchema = z
  .string()
  .trim()
  .min(1, "Website URL Is Required.")
  .max(2048)
  .regex(WEBSITE_URL_PATTERN, "Enter A Valid Website URL.")
  .transform(normalizeWebsiteUrl);

/** POST /api/v1/clients — request body. */
export const createClientSchema = z.object({
  businessName: displayNameSchema({
    min: 1,
    requiredMessage: "Business Name Is Required.",
  }),
  websiteUrl: websiteUrlSchema,
  businessAddress: optionalText,
  pocContactNumber: optionalShortText,
  pocEmail: optionalEmail,
  servicesOffered: stringListSchema,
  primaryServiceToPromote: optionalShortText,
  idealCustomerProfile: optionalText,
  targetLocations: stringListSchema,
  seoGoals: z.array(z.enum(SEO_GOALS)).optional().default([]),
  competitorUrls: competitorListSchema,
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

const updateStringListSchema = z.array(z.string().trim().min(1).max(255)).nullable().optional();
const updateCompetitorListSchema = z.array(z.string().trim().min(1).max(2048)).nullable().optional();

/** PATCH /api/v1/clients/{id} — partial body. Share token is never rotated from this schema. */
export const updateClientSchema = z.object({
  businessName: displayNameSchema({
    min: 1,
    requiredMessage: "Business Name Is Required.",
  }).optional(),
  websiteUrl: websiteUrlSchema.optional(),
  businessAddress: optionalText,
  pocContactNumber: optionalShortText,
  pocEmail: optionalEmail,
  servicesOffered: updateStringListSchema,
  primaryServiceToPromote: optionalShortText,
  idealCustomerProfile: optionalText,
  targetLocations: updateStringListSchema,
  seoGoals: z.array(z.enum(SEO_GOALS)).nullable().optional(),
  competitorUrls: updateCompetitorListSchema,
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;
