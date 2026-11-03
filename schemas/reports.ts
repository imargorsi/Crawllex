import { z } from "zod";

import { ANALYTICS_MAX_RANGE_DAYS } from "@/lib/integrations/constants";
import { inclusiveDaySpan } from "@/lib/integrations/date.utils";
import { isRichDocEmpty, type TRichDoc } from "@/lib/reports/rich-text";

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date Must Be YYYY-MM-DD.");

/** Limits for hand-written report text. */
const RICH_MAX_BLOCKS = 200;
const RICH_MAX_CHARS = 30_000;

const richInlineSchema = z.object({
  text: z.string().max(5_000, "Text Is Too Long."),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
});

const richRunsSchema = z.array(richInlineSchema).max(500);

const richBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), runs: richRunsSchema }),
  z.object({ type: z.literal("paragraph"), runs: richRunsSchema }),
  z.object({ type: z.literal("bullets"), items: z.array(richRunsSchema).max(200) }),
]);

const richDocSchema: z.ZodType<TRichDoc> = z
  .array(richBlockSchema)
  .max(RICH_MAX_BLOCKS, "Text Has Too Many Blocks.")
  .refine((doc) => documentChars(doc) <= RICH_MAX_CHARS, "Text Is Too Long.");

function documentChars(doc: TRichDoc): number {
  return doc.reduce((total, block) => {
    const runs = block.type === "bullets" ? block.items.flat() : block.runs;
    return total + runs.reduce((sum, run) => sum + run.text.length, 0);
  }, 0);
}

/** Optional section text: empty input becomes null, so the generated text is used. */
const optionalRichDoc = richDocSchema
  .nullish()
  .transform((doc) => (doc && !isRichDocEmpty(doc) ? doc : null));

/** Next Steps must be written. */
const requiredRichDoc = richDocSchema.refine((doc) => !isRichDocEmpty(doc), "Next Steps Are Required.");

export const createReportSchema = z
  .object({
    periodFrom: isoDateSchema,
    periodTo: isoDateSchema,
    written: z
      .object({
        executiveSummary: optionalRichDoc,
        search: optionalRichDoc,
        traffic: optionalRichDoc,
        leads: optionalRichDoc,
        work: optionalRichDoc,
      })
      .default({ executiveSummary: null, search: null, traffic: null, leads: null, work: null }),
    nextSteps: requiredRichDoc,
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
