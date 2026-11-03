import { describe, expect, it } from "vitest";

import { ASSISTANT_TITLE_MAX_CHARS, threadTitle } from "@/lib/assistant/history";
import { assistantQuerySchema } from "@/schemas/assistant";

describe("assistant thread titles", () => {
  it("uses the first question as the title", () => {
    expect(threadTitle("  Leads   this month? ")).toBe("Leads this month?");
  });

  it("cuts long titles with an ellipsis", () => {
    const long = "x".repeat(200);
    const title = threadTitle(long);
    expect(title.length).toBe(ASSISTANT_TITLE_MAX_CHARS);
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("assistant query schema with threads", () => {
  it("accepts a query without a thread id (new conversation)", () => {
    expect(assistantQuerySchema.parse({ query: "leads today" }).threadId).toBeUndefined();
  });

  it("accepts a well-formed thread id", () => {
    const parsed = assistantQuerySchema.parse({
      query: "leads today",
      threadId: "7f3c2a9e-1b4d-4c8e-9f0a-123456789abc",
    });
    expect(parsed.threadId).toBe("7f3c2a9e-1b4d-4c8e-9f0a-123456789abc");
  });

  it("rejects thread ids with unsafe characters or bad length", () => {
    expect(() => assistantQuerySchema.parse({ query: "q", threadId: "abc" })).toThrow();
    expect(() => assistantQuerySchema.parse({ query: "q", threadId: "../../etc/passwd" })).toThrow();
  });
});
