import { z } from "zod";

import { ORIEL_QUESTION_MAX_CHARS } from "@/lib/oriel/config";

export const orielQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Question is required.")
    .max(ORIEL_QUESTION_MAX_CHARS, "Question is too long."),
});

export type TOrielQueryInput = z.infer<typeof orielQuerySchema>;
