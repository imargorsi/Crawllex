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
  type TChatRequest,
} from "@/lib/assistant/ai/llm-client";
import {
  answerWithAi,
  aiBreakerOpen,
  recordAiFailure,
  resetAiBreakerForTests,
  tryAnswerWithAi,
} from "@/lib/assistant/ai/run-ai-query";
import { assistantToolDeclarations, executeAssistantTool } from "@/lib/assistant/ai/tools";

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
  const NOW = new Date("2026-10-20T10:00:00Z");

  it("reads the 30 days ending yesterday, then makes one model call with no tools", async () => {
    const execute = vi.fn(async (name: string, args: unknown) => ({ ok: true as const, data: { name, args } }));
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("Summary."));

    const answer = await answerWithAi("how are we doing", { generate, execute }, NOW);

    expect(answer.message).toBe("Summary.");
    expect(generate).toHaveBeenCalledTimes(1);
    expect(generate.mock.calls[0]?.[0]?.tools).toEqual([]);
    expect(execute).toHaveBeenCalledTimes(3);
    for (const call of execute.mock.calls) {
      expect(call[1]).toEqual({ from: "2026-09-20", to: "2026-10-19" });
    }
  });

  it("puts the fetched data and the question in the user message", async () => {
    const execute = vi.fn(async (_name: string, _args: unknown) => ({ ok: true as const, data: { leads: 7 } }));
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("ok"));

    await answerWithAi("leads?", { generate, execute }, NOW);

    const user = generate.mock.calls[0]?.[0]?.messages[1];
    expect(user?.content).toContain("Question: leads?");
    expect(user?.content).toContain('"leads":7');
  });

  it("passes a tool error into the data as an error, not a throw", async () => {
    const execute = vi.fn(async (name: string, _args: unknown) =>
      name === "get_leads_count" ? { ok: false as const, error: "Module Not Available." } : { ok: true as const, data: {} },
    );
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("ok"));

    await answerWithAi("q", { generate, execute }, NOW);

    expect(generate.mock.calls[0]?.[0]?.messages[1]?.content).toContain('"error":"Module Not Available."');
  });

  it("puts today's date and the data range in the system instruction", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("ok"));
    await answerWithAi("q", { generate, execute: vi.fn(async () => ({ ok: true as const, data: {} })) }, NOW);
    const system = generate.mock.calls[0]?.[0]?.messages[0];
    expect(system).toMatchObject({ role: "system" });
    expect(system?.content).toContain("Today is 2026-10-20");
    expect(system?.content).toContain("covers 2026-09-20 to 2026-10-19");
    expect(system?.content).toContain("Period: 2026-09-20 to 2026-10-19.");
  });

  it("rejects an empty model reply", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply(""));
    await expect(
      answerWithAi("q", { generate, execute: vi.fn(async () => ({ ok: true as const, data: {} })) }, NOW),
    ).rejects.toMatchObject({ reason: "invalid_response" });
  });
});

describe("tryAnswerWithAi fallback", () => {
  const deps = (generate: () => Promise<TAssistantMessage>) => ({
    generate,
    execute: vi.fn(async () => ({ ok: true as const, data: {} })),
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

describe("llm client", () => {
  const request = { messages: [{ role: "user" as const, content: "q" }], tools: [] };
  const setLlm = () => {
    vi.stubEnv("LLM_BASE_URL", "http://100.90.184.0:8092");
    vi.stubEnv("LLM_USER", "owner");
    vi.stubEnv("LLM_PASSWORD", "test-pass");
    vi.stubEnv("LLM_MODEL", "qwen3-8b");
  };

  it("throws disabled when any LLM variable is missing", async () => {
    setLlm();
    vi.stubEnv("LLM_PASSWORD", "");
    await expect(generateChatCompletion(request)).rejects.toMatchObject({ reason: "disabled" });
  });

  it("returns http with status on a non-OK reply and does not retry", async () => {
    setLlm();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateChatCompletion(request)).rejects.toMatchObject({ reason: "http", status: 503 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends Basic auth to the tailnet endpoint, the model, reasoning off and tool declarations", async () => {
    setLlm();
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

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://100.90.184.0:8092/v1/chat/completions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("owner:test-pass").toString("base64")}`,
    );
    const sent = JSON.parse(String(init.body));
    expect(sent.model).toBe("qwen3-8b");
    expect(sent.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(sent.tools[0]).toEqual({
      type: "function",
      function: { name: "t", description: "d", parameters: { type: "object", properties: {} } },
    });
  });

  it("sends the real assistant tool schemas with lowercase JSON Schema types", async () => {
    setLlm();
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: "ok" } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await generateChatCompletion({ messages: [{ role: "user", content: "q" }], tools: assistantToolDeclarations() });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    const sent = JSON.parse(String(init.body));
    const serialized = JSON.stringify(sent.tools);
    expect(serialized).not.toMatch(/"type":"(OBJECT|STRING|INTEGER|NUMBER|BOOLEAN|ARRAY)"/);
    expect(sent.tools[0].function.parameters.type).toBe("object");
  });

  it("returns tool calls from the reply", async () => {
    setLlm();
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

describe("llm client streaming", () => {
  const request = { messages: [{ role: "user" as const, content: "q" }], tools: [] };
  const setLlm = () => {
    vi.stubEnv("LLM_BASE_URL", "http://100.90.184.0:8092");
    vi.stubEnv("LLM_USER", "owner");
    vi.stubEnv("LLM_PASSWORD", "test-pass");
    vi.stubEnv("LLM_MODEL", "qwen3-8b");
  };
  const sseReply = (lines: string[]) =>
    new Response(lines.map((line) => `data: ${line}\n\n`).join(""), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

  it("streams text deltas to onToken in order and returns the joined text", async () => {
    setLlm();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseReply([
          JSON.stringify({ choices: [{ delta: { content: "Lea" } }] }),
          JSON.stringify({ choices: [{ delta: { content: "ds: 4" } }] }),
          "[DONE]",
        ]),
      ),
    );
    const seen: string[] = [];
    const reply = await generateChatCompletion(request, (text) => seen.push(text));
    expect(seen).toEqual(["Lea", "ds: 4"]);
    expect(reply.content).toBe("Leads: 4");
  });

  it("joins streamed tool-call fragments by index", async () => {
    setLlm();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        sseReply([
          JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, id: "c1", function: { name: "get_leads_count", arguments: "{\"from\":" } }] } }] }),
          JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: "\"2026-10-01\"}" } }] } }] }),
          "[DONE]",
        ]),
      ),
    );
    const reply = await generateChatCompletion(request, () => undefined);
    expect(reply.tool_calls).toEqual([
      { id: "c1", type: "function", function: { name: "get_leads_count", arguments: "{\"from\":\"2026-10-01\"}" } },
    ]);
  });

  it("asks for a stream and keeps reasoning off when streaming", async () => {
    setLlm();
    const fetchMock = vi.fn(async () => sseReply(["[DONE]"]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(generateChatCompletion(request, () => undefined)).rejects.toMatchObject({ reason: "invalid_response" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.stream).toBe(true);
    expect(body.max_tokens).toBe(300);
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
  });
});
