import { z } from "zod";

export const wpDraftSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200, "Use at most 200 characters."),
  content: z.string().min(1, "Content is required.").max(100_000, "Content is too long."),
  excerpt: z.string().trim().max(500, "Use at most 500 characters.").optional(),
});

export type WpDraftInput = z.infer<typeof wpDraftSchema>;
