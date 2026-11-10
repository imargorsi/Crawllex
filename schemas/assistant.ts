import { z } from "zod";

export const assistantQuerySchema = z.object({
  query: z.string().trim().min(1, "Query is required.").max(500, "Query must be 500 characters or fewer."),
  threadId: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{8,64}$/, "Invalid conversation id.")
    .optional(),
});

export type AssistantQueryInput = z.infer<typeof assistantQuerySchema>;
