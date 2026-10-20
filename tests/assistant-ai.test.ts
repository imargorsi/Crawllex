import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/integrations/read-analytics", () => ({
  getAnalyticsOverview: vi.fn(async () => ({
    cards: {
      clicks: { value: 120 },
      impressions: { value: 4000 },
      ctr: { value: 0.03 },
      position: { value: 8.5 },
    },
    ga4: { sessions: 300, totalUsers: 210, newUsers: 150, organicSessions: 180 },
    engagement: {
      pageViews: { value: 900 },
      engagementRate: { value: 0.61 },
      avgSessionDuration: { value: 95 },
    },
  })),
  getAnalyticsDimensions: vi.fn(async () => ({
    rows: [{ dimensionValue: "x".repeat(300), clicks: 5, impressions: 50, ctr: 0.1, position: 2 }],
  })),
}));
vi.mock("@/lib/leads/list-leads", () => ({
  countLeadsInRange: vi.fn(async () => 7),
}));
vi.mock("@/lib/seo-activities/list-seo-activities", () => ({
  getSeoActivityCounts: vi.fn(async () => ({ blogs: 2, backlinks: 1 })),
}));

import { getAnalyticsDimensions } from "@/lib/integrations/read-analytics";
import { countLeadsInRange } from "@/lib/leads/list-leads";
import {
  AssistantAiError,
  type TGeminiContent,
} from "@/lib/assistant/ai/gemini-client";
import {
  answerWithAi,
  aiBreakerOpen,
  recordAiFailure,
  resetAiBreakerForTests,
  tryAnswerWithAi,
} from "@/lib/assistant/ai/run-ai-query";
import { executeAssistantTool } from "@/lib/assistant/ai/tools";

const PROJECT = "507f1f77bcf86cd799439011";
const ALL = ["leads.view", "analytics.view", "seo_activities.view"];

beforeEach(() => {
  vi.clearAllMocks();
  resetAiBreakerForTests();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("assistant AI tools", () => {
  it("rejects bad dates, reversed ranges and ranges over the cap", async () => {
    const bad = await executeAssistantTool(
      "get_leads_count",
      { from: "2026-13-01", to: "2026-10-01" },
      PROJECT,
      ALL,
    );
    expect(bad.ok).toBe(false);

    const reversed = await executeAssistantTool(
      "get_leads_count",
      { from: "2026-10-10", to: "2026-10-01" },
      PROJECT,
      ALL,
    );
    expect(reversed).toMatchObject({ ok: false });

    const tooLong = await executeAssistantTool(
      "get_analytics_overview",
      { from: "2024-01-01", to: "2026-10-01" },
      PROJECT,
      ALL,
    );
    expect(tooLong).toMatchObject({ ok: false });

    expect(countLeadsInRange).not.toHaveBeenCalled();
  });

  it("denies a tool when the caller lacks the module permission", async () => {
    const result = await executeAssistantTool(
      "get_leads_count",
      { from: "2026-10-01", to: "2026-10-10" },
      PROJECT,
      ["analytics.view"],
    );
    expect(result).toEqual({ ok: false, error: "Not Permitted For This Project." });
    expect(countLeadsInRange).not.toHaveBeenCalled();
  });

  it("returns a lead count only, scoped to the server project", async () => {
    const result = await executeAssistantTool(
      "get_leads_count",
      { from: "2026-10-01", to: "2026-10-10" },
      PROJECT,
      ALL,
    );
    expect(result).toEqual({
      ok: true,
      data: { from: "2026-10-01", to: "2026-10-10", leads: 7 },
    });
    expect(countLeadsInRange).toHaveBeenCalledWith(PROJECT, "2026-10-01", "2026-10-10");
  });

  it("ignores any projectId the model supplies", async () => {
    await executeAssistantTool(
      "get_leads_count",
      { from: "2026-10-01", to: "2026-10-10", projectId: "other-project" },
      PROJECT,
      ALL,
    );
    expect(countLeadsInRange).toHaveBeenCalledWith(PROJECT, "2026-10-01", "2026-10-10");
  });

  it("caps dimension rows and truncates long values", async () => {
    const result = await executeAssistantTool(
      "get_analytics_top_dimensions",
      { from: "2026-10-01", to: "2026-10-10", source: "gsc", dimensionType: "query", limit: 999 },
      PROJECT,
      ALL,
    );
    expect(result).toMatchObject({ ok: false });

    const ok = await executeAssistantTool(
      "get_analytics_top_dimensions",
      { from: "2026-10-01", to: "2026-10-10", source: "gsc", dimensionType: "query", limit: 5 },
      PROJECT,
      ALL,
    );
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      const rows = (ok.data as { rows: Array<{ value: string }> }).rows;
      expect(rows[0].value.length).toBeLessThanOrEqual(201);
    }
    expect(getAnalyticsDimensions).toHaveBeenCalledWith(
      PROJECT,
      expect.objectContaining({ limit: 5, source: "gsc", dimensionType: "query" }),
    );
  });

  it("rejects unknown tool names", async () => {
    const result = await executeAssistantTool("delete_lead", {}, PROJECT, ALL);
    expect(result).toEqual({ ok: false, error: "Unknown Tool." });
  });
});

function modelText(text: string): TGeminiContent {
  return { role: "model", parts: [{ text }] };
}

function modelCall(name: string, args: Record<string, unknown>): TGeminiContent {
  return { role: "model", parts: [{ functionCall: { name, args }, thoughtSignature: "sig" }] };
}

describe("answerWithAi", () => {
  it("returns plain text when no tool is needed", async () => {
    const answer = await answerWithAi("hi", {
      generate: vi.fn(async () => modelText("Hello.")),
      execute: vi.fn(),
    });
    expect(answer).toEqual({ message: "Hello.", toolCalls: [] });
  });

  it("runs a tool and feeds the result back before answering", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(modelCall("get_leads_count", { from: "2026-10-01", to: "2026-10-10" }))
      .mockResolvedValueOnce(modelText("You had 7 leads."));
    const execute = vi.fn(async () => ({ ok: true as const, data: { leads: 7 } }));

    const answer = await answerWithAi("leads?", { generate, execute });

    expect(execute).toHaveBeenCalledWith("get_leads_count", {
      from: "2026-10-01",
      to: "2026-10-10",
    });
    expect(answer).toEqual({ message: "You had 7 leads.", toolCalls: ["get_leads_count"] });

    const secondRequest = generate.mock.calls[1][0];
    const last = secondRequest.contents[secondRequest.contents.length - 1];
    expect(last.role).toBe("user");
    expect(last.parts[0].functionResponse).toEqual({
      name: "get_leads_count",
      response: { data: { leads: 7 } },
    });
  });

  it("passes tool errors back to the model instead of throwing", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(modelCall("get_analytics_overview", { from: "2026-10-01", to: "2026-10-10" }))
      .mockResolvedValueOnce(modelText("Analytics are not available for this range."));
    const execute = vi.fn(async () => ({ ok: false as const, error: "Not Permitted For This Project." }));

    const answer = await answerWithAi("traffic?", { generate, execute });
    expect(answer.message).toBe("Analytics are not available for this range.");
    const second = generate.mock.calls[1][0];
    expect(second.contents[second.contents.length - 1].parts[0].functionResponse).toEqual({
      name: "get_analytics_overview",
      response: { error: "Not Permitted For This Project." },
    });
  });

  it("stops after the turn cap instead of looping forever", async () => {
    const generate = vi.fn(async () => modelCall("get_leads_count", { from: "2026-10-01", to: "2026-10-10" }));
    const execute = vi.fn(async () => ({ ok: true as const, data: {} }));

    await expect(answerWithAi("loop", { generate, execute })).rejects.toMatchObject({
      reason: "tool_limit",
    });
    expect(generate).toHaveBeenCalledTimes(5);
  });

  it("rejects an empty model reply", async () => {
    await expect(
      answerWithAi("x", { generate: vi.fn(async () => modelText("   ")), execute: vi.fn() }),
    ).rejects.toBeInstanceOf(AssistantAiError);
  });
});

describe("tryAnswerWithAi fallback", () => {
  const deps = (generate: () => Promise<TGeminiContent>) => ({
    generate,
    execute: vi.fn(),
  });

  it("returns null on provider failure so NLP can answer", async () => {
    const result = await tryAnswerWithAi(
      "q",
      deps(async () => {
        throw new AssistantAiError("http", 429);
      }),
    );
    expect(result).toBeNull();
  });

  it("opens the breaker after repeated failures and skips the provider", async () => {
    const generate = vi.fn(async () => {
      throw new AssistantAiError("timeout");
    });
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      await tryAnswerWithAi("q", deps(generate), now);
    }
    expect(aiBreakerOpen(now)).toBe(true);

    generate.mockClear();
    const skipped = await tryAnswerWithAi("q", deps(generate), now + 1000);
    expect(skipped).toBeNull();
    expect(generate).not.toHaveBeenCalled();
  });

  it("closes the breaker after the open window", () => {
    const now = 1_000_000;
    recordAiFailure(now);
    recordAiFailure(now);
    recordAiFailure(now);
    expect(aiBreakerOpen(now)).toBe(true);
    expect(aiBreakerOpen(now + 5 * 60 * 1000 + 1)).toBe(false);
  });

  it("logs the reason only, never the query text", async () => {
    const spy = vi.spyOn(console, "error");
    await tryAnswerWithAi(
      "secret lead name Jane",
      deps(async () => {
        throw new AssistantAiError("timeout");
      }),
    );
    const logged = spy.mock.calls.map((call) => String(call[0])).join(" ");
    expect(logged).toContain("timeout");
    expect(logged).not.toContain("Jane");
  });
});
