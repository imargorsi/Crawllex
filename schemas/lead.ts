import { z } from "zod";

import {
  LEAD_DATE_USE_TODAY,
  LEAD_EMAIL_MAX_LENGTH,
  LEAD_EXTRAS_MAX_KEYS,
  LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH,
  LEAD_INGEST_IDEMPOTENCY_KEY_MIN_LENGTH,
  LEAD_INGEST_PLUGIN_VERSION_MAX_LENGTH,
  LEAD_MESSAGE_MAX_LENGTH,
  LEAD_NAME_MAX_LENGTH,
  LEAD_PHONE_MAX_LENGTH,
  LEAD_SERVICES_MAX_LENGTH,
  LEAD_SOURCE_SITE_URL_MAX_LENGTH,
} from "@/lib/leads/constants";
import {
  isValidLeadDate,
  isValidLeadEmail,
  normalizeLeadPhone,
  parseLeadDateCell,
  todayLeadDate,
} from "@/lib/leads/normalize";

const leadFirstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required.")
  .max(LEAD_NAME_MAX_LENGTH, `Use at most ${LEAD_NAME_MAX_LENGTH} characters.`);

const leadLastNameSchema = z
  .string()
  .trim()
  .max(LEAD_NAME_MAX_LENGTH, `Use at most ${LEAD_NAME_MAX_LENGTH} characters.`)
  .optional()
  .transform((value) => value ?? "");

const leadEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(LEAD_EMAIL_MAX_LENGTH, `Use at most ${LEAD_EMAIL_MAX_LENGTH} characters.`)
  .refine((value) => isValidLeadEmail(value), "Enter a valid email.");

const leadPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .max(LEAD_PHONE_MAX_LENGTH, `Use at most ${LEAD_PHONE_MAX_LENGTH} characters.`)
  .refine((value) => normalizeLeadPhone(value).length >= 7, "Enter a valid phone number.");

const leadIngestPhoneSchema = z
  .string()
  .trim()
  .max(LEAD_PHONE_MAX_LENGTH, `Use at most ${LEAD_PHONE_MAX_LENGTH} characters.`)
  .optional()
  .transform((value) => value ?? "")
  .refine(
    (value) => value === "" || normalizeLeadPhone(value).length >= 7,
    "Enter a valid phone number.",
  );

const leadServicesSchema = z
  .string()
  .trim()
  .max(LEAD_SERVICES_MAX_LENGTH, `Use at most ${LEAD_SERVICES_MAX_LENGTH} characters.`)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const leadMessageSchema = z
  .string()
  .trim()
  .min(1, "Message is required.")
  .max(LEAD_MESSAGE_MAX_LENGTH, `Use at most ${LEAD_MESSAGE_MAX_LENGTH} characters.`);

const leadDateSchema = z
  .string()
  .trim()
  .min(1, "Date is required.")
  .refine((value) => isValidLeadDate(value), "Enter a valid date.");

export const leadFieldsSchema = z.object({
  firstName: leadFirstNameSchema,
  lastName: leadLastNameSchema,
  email: leadEmailSchema,
  phone: leadPhoneSchema,
  servicesInterestedIn: leadServicesSchema,
  message: leadMessageSchema,
  leadDate: leadDateSchema,
});

export const leadImportRowSchema = leadFieldsSchema;
export const createLeadSchema = leadFieldsSchema;
export const updateLeadSchema = leadFieldsSchema;

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

const pluginVersionSchema = z
  .string()
  .trim()
  .min(1, "Plugin version is required.")
  .max(
    LEAD_INGEST_PLUGIN_VERSION_MAX_LENGTH,
    `Use at most ${LEAD_INGEST_PLUGIN_VERSION_MAX_LENGTH} characters.`,
  );

const idempotencyKeySchema = z
  .string()
  .trim()
  .min(
    LEAD_INGEST_IDEMPOTENCY_KEY_MIN_LENGTH,
    `Use at least ${LEAD_INGEST_IDEMPOTENCY_KEY_MIN_LENGTH} characters.`,
  )
  .max(
    LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH,
    `Use at most ${LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH} characters.`,
  )
  .regex(/^[A-Za-z0-9._:-]+$/, "Use letters, numbers, dots, underscores, colons, or hyphens.");

export const ingestVerifySchema = z.object({
  pluginVersion: pluginVersionSchema,
  siteUrl: z.string().trim().max(LEAD_SOURCE_SITE_URL_MAX_LENGTH).optional(),
});

export const ingestLeadSchema = z.object({
  firstName: leadFirstNameSchema,
  lastName: leadLastNameSchema,
  email: leadEmailSchema,
  phone: leadIngestPhoneSchema,
  servicesInterestedIn: leadServicesSchema,
  message: leadMessageSchema,
  leadDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : todayLeadDate()))
    .refine((value) => isValidLeadDate(value), "Enter a valid date."),
  extras: z
    .record(z.string(), z.string())
    .optional()
    .default({})
    .refine(
      (value) => Object.keys(value).length <= LEAD_EXTRAS_MAX_KEYS,
      `Keep at most ${LEAD_EXTRAS_MAX_KEYS} extra fields.`,
    ),
  idempotencyKey: idempotencyKeySchema,
  pluginVersion: pluginVersionSchema,
  siteUrl: z.string().trim().max(LEAD_SOURCE_SITE_URL_MAX_LENGTH).optional(),
});

export type IngestVerifyInput = z.infer<typeof ingestVerifySchema>;
export type IngestLeadInput = z.infer<typeof ingestLeadSchema>;

export const leadImportMappingSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name column is required."),
    lastName: z.string().trim().optional().default(""),
    email: z.string().trim().min(1, "Email column is required."),
    phone: z.string().trim().min(1, "Phone column is required."),
    message: z.string().trim().min(1, "Message column is required."),
    servicesInterestedIn: z.string().trim().optional().default(""),
    leadDate: z.string().trim().optional().default(LEAD_DATE_USE_TODAY),
    extras: z
      .array(z.string().trim().min(1))
      .max(LEAD_EXTRAS_MAX_KEYS, `Keep at most ${LEAD_EXTRAS_MAX_KEYS} extra columns.`)
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const mappedHeaders = [
      data.firstName,
      data.lastName,
      data.email,
      data.phone,
      data.message,
      data.servicesInterestedIn,
      data.leadDate !== LEAD_DATE_USE_TODAY ? data.leadDate : "",
    ].filter((value) => value.length > 0);

    const unique = new Set(mappedHeaders);
    if (unique.size !== mappedHeaders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mapping"],
        message: "Each CSV column may map to only one lead field.",
      });
    }

    const extrasUnique = new Set(data.extras);
    if (extrasUnique.size !== data.extras.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["extras"],
        message: "Extra columns must be unique.",
      });
    }

    for (const header of data.extras) {
      if (unique.has(header)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["extras"],
          message: `Column "${header}" is already mapped to a lead field.`,
        });
        break;
      }
    }
  });

export type LeadImportMappingInput = z.infer<typeof leadImportMappingSchema>;

export function parseLeadImportMapping(body: unknown): LeadImportMappingInput {
  return leadImportMappingSchema.parse(body);
}

export function resolveImportLeadDate(
  mapping: LeadImportMappingInput,
  row: Record<string, string>,
): string | null {
  if (!mapping.leadDate || mapping.leadDate === LEAD_DATE_USE_TODAY) {
    return todayLeadDate();
  }
  const raw = (row[mapping.leadDate] ?? "").trim();
  if (!raw) return todayLeadDate();
  return parseLeadDateCell(raw);
}
