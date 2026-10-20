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
  generateChatCompletion,
  type TAssistantMessage,
} from "@/lib/assistant/ai/openrouter-client";
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
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
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

function textReply(text: string): TAssistantMessage {
  return { content: text };
}

function toolReply(name: string, args: Record<string, unknown>, id = "call_1"): TAssistantMessage {
  return {
    content: null,
    tool_calls: [{ id, type: "function", function: { name, arguments: JSON.stringify(args) } }],
  };
}

describe("answerWithAi", () => {
  it("returns plain text when no tool is needed", async () => {
    const answer = await answerWithAi("hi", {
      generate: vi.fn(async () => textReply("Hello.")),
      execute: vi.fn(),
    });
    expect(answer).toEqual({ message: "Hello.", toolCalls: [] });
  });

  it("runs a tool and feeds the result back before answering", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(toolReply("get_leads_count", { from: "2026-10-01", to: "2026-10-10" }))
      .mockResolvedValueOnce(textReply("You had 7 leads."));
    const execute = vi.fn(async () => ({ ok: true as const, data: { leads: 7 } }));

    const answer = await answerWithAi("leads?", { generate, execute });

    expect(execute).toHaveBeenCalledWith("get_leads_count", { from: "2026-10-01", to: "2026-10-10" });
    expect(answer).toEqual({ message: "You had 7 leads.", toolCalls: ["get_leads_count"] });

    const second = generate.mock.calls[1][0];
    const toolMessage = second.messages[second.messages.length - 1];
    expect(toolMessage).toMatchObject({ role: "tool", tool_call_id: "call_1" });
    expect(JSON.parse(toolMessage.content)).toEqual({ data: { leads: 7 } });
  });

  it("passes tool errors back to the model instead of throwing", async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce(toolReply("get_analytics_overview", { from: "2026-10-01", to: "2026-10-10" }))
      .mockResolvedValueOnce(textReply("Analytics are not available for this range."));
    const execute = vi.fn(async () => ({ ok: false as const, error: "Not Permitted For This Project." }));

    const answer = await answerWithAi("traffic?", { generate, execute });
    expect(answer.message).toBe("Analytics are not available for this range.");
    const second = generate.mock.calls[1][0];
    expect(JSON.parse(second.messages[second.messages.length - 1].content)).toEqual({
      error: "Not Permitted For This Project.",
    });
  });

  it("reports invalid tool arguments to the model without calling the tool", async () => {
    const badCall: TAssistantMessage = {
      content: null,
      tool_calls: [{ id: "c", type: "function", function: { name: "get_leads_count", arguments: "{not json" } }],
    };
    const generate = vi.fn().mockResolvedValueOnce(badCall).mockResolvedValueOnce(textReply("ok"));
    const execute = vi.fn();

    await answerWithAi("x", { generate, execute });
    expect(execute).not.toHaveBeenCalled();
    const second = generate.mock.calls[1][0];
    expect(JSON.parse(second.messages[second.messages.length - 1].content)).toEqual({
      error: "Invalid Tool Arguments.",
    });
  });

  it("stops after the turn cap instead of looping forever", async () => {
    const generate = vi.fn(async () => toolReply("get_leads_count", { from: "2026-10-01", to: "2026-10-10" }));
    const execute = vi.fn(async () => ({ ok: true as const, data: {} }));

    await expect(answerWithAi("loop", { generate, execute })).rejects.toMatchObject({ reason: "tool_limit" });
    expect(generate).toHaveBeenCalledTimes(5);
  });

  it("rejects an empty model reply", async () => {
    await expect(
      answerWithAi("x", { generate: vi.fn(async () => textReply("   ")), execute: vi.fn() }),
    ).rejects.toBeInstanceOf(AssistantAiError);
  });
});

describe("tryAnswerWithAi fallback", () => {
  const deps = (generate: () => Promise<TAssistantMessage>) => ({ generate, execute: vi.fn() });

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
    expect(await tryAnswerWithAi("q", deps(generate), now + 1000)).toBeNull();
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

  it("logs the reason and status only, never the query text", async () => {
    const spy = vi.spyOn(console, "error");
    await tryAnswerWithAi(
      "secret lead name Jane",
      deps(async () => {
        throw new AssistantAiError("http", 429);
      }),
    );
    const logged = spy.mock.calls.map((call) => String(call[0])).join(" ");
    expect(logged).toContain("http (HTTP 429)");
    expect(logged).not.toContain("Jane");
  });
});

describe("openrouter client", () => {
  const request = { messages: [{ role: "user" as const, content: "q" }], tools: [] };

  it("throws disabled without an API key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(generateChatCompletion(request)).rejects.toMatchObject({ reason: "disabled" });
  });

  it("retries once on 429 and returns the second response", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const body = { choices: [{ message: { role: "assistant", content: "ok" } }] };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const reply = await generateChatCompletion(request);
    expect(reply.content).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after a second 429 and keeps the status", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 429 })));
    await expect(generateChatCompletion(request)).rejects.toMatchObject({ reason: "http", status: 429 });
  });

  it("sends Bearer auth, the model and tool declarations", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    vi.stubEnv("OPENROUTER_MODEL", "dots-studio/dots-3-note-preview:free");
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: "ok" } }] }), {
          status: 200,
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await generateChatCompletion({
      messages: [{ role: "user", content: "q" }],
      tools: [{ name: "t", description: "d", parameters: { type: "object", properties: {} } }],
    });

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const sent = JSON.parse(String(init.body));
    expect(sent.model).toBe("dots-studio/dots-3-note-preview:free");
    expect(sent.tools[0]).toEqual({
      type: "function",
      function: { name: "t", description: "d", parameters: { type: "object", properties: {} } },
    });
  });

  it("returns tool calls from the reply", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const body = {
      choices: [
        {
          message: {
            role: "assistant",
            content: null,
            tool_calls: [{ id: "c1", type: "function", function: { name: "get_leads_count", arguments: "{}" } }],
          },
        },
      ],
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));
    const reply = await generateChatCompletion(request);
    expect(reply.tool_calls?.[0].function.name).toBe("get_leads_count");
  });
});

