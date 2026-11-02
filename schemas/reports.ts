import { z } from "zod";

import { ANALYTICS_MAX_RANGE_DAYS } from "@/lib/integrations/constants";
import { inclusiveDaySpan } from "@/lib/integrations/date.utils";
import { REPORT_MAX_HIGHLIGHTS } from "@/lib/reports/constants";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date Must Be YYYY-MM-DD.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must Be ${max} Characters Or Fewer.`)
    .nullish()
    .transform((value) => (value ? value : null));

export const createReportSchema = z
  .object({
    periodFrom: isoDateSchema,
    periodTo: isoDateSchema,
    highlights: z
      .array(z.string().trim().min(1, "Highlight Cannot Be Empty.").max(300, "Highlight Is Too Long."))
      .max(REPORT_MAX_HIGHLIGHTS, `Add ${REPORT_MAX_HIGHLIGHTS} Highlights Or Fewer.`)
      .default([]),
    translationStatus: optionalText(500),
    closingNote: optionalText(1000),
  })
  .superRefine((value, ctx) => {
    if (value.periodFrom > value.periodTo) {
      ctx.addIssue({
        code: "custom",
        path: ["periodFrom"],
        message: "Period Start Must Be On Or Before Period End.",
      });
      return;
    }
    if (inclusiveDaySpan(value.periodFrom, value.periodTo) > ANALYTICS_MAX_RANGE_DAYS) {
      ctx.addIssue({
        code: "custom",
        path: ["periodTo"],
        message: `Period Must Be ${ANALYTICS_MAX_RANGE_DAYS} Days Or Fewer.`,
      });
    }
  });

export type CreateReportInput = z.infer<typeof createReportSchema>;
