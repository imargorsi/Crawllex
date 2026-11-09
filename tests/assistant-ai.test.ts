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
  FOLLOW_UP_MAX_TOKENS,
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
  const FOLLOW_UP = [{ query: "earlier question", answer: "earlier answer" }];
  const okData = async (_name: string, _args: unknown) => ({
    ok: true as const,
    data: { leads: 7, gsc: { clicks: 120, impressions: 900, ctr: 0.13, averagePosition: 8.2 }, ga4: { sessions: 300, totalUsers: 210 } },
  });
  const noModel = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("unused"));

  it("answers a first question with the code-built brief, with no model call", async () => {
    const generate = vi.fn(noModel);
    const chunks: string[] = [];
    const answer = await answerWithAi("how are we doing", { generate, execute: okData }, NOW, (text) => chunks.push(text));

    expect(answer.mode).toBe("brief");
    expect(generate).not.toHaveBeenCalled();
    expect(answer.message).toContain("## Search performance");
    expect(answer.message).toContain("- Clicks: **120** from Google search results");
    expect(answer.message.endsWith("Period: 2026-09-20 to 2026-10-19.")).toBe(true);
    expect(chunks.join("")).toBe(answer.message);
  });

  it("reads the 30 days ending yesterday for every tool", async () => {
    const execute = vi.fn(okData);
    await answerWithAi("q", { generate: vi.fn(noModel), execute }, NOW);
    expect(execute).toHaveBeenCalledTimes(3);
    for (const call of execute.mock.calls) {
      expect(call[1]).toEqual({ from: "2026-09-20", to: "2026-10-19" });
    }
  });

  it("leaves out a section whose tool returned an error instead of showing zeros", async () => {
    const execute = vi.fn(async (name: string, _args: unknown) =>
      name === "get_leads_count" ? { ok: false as const, error: "Module Not Available." } : { ok: true as const, data: {} },
    );
    const answer = await answerWithAi("q", { generate: vi.fn(noModel), execute }, NOW);
    expect(answer.message).not.toContain("Leads");
    expect(answer.message).not.toContain("Module Not Available");
  });

  it("answers a follow-up with one model call that sees the earlier turns and the data", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("Clicks rose."));
    const answer = await answerWithAi("why?", { generate, execute: okData }, NOW, undefined, FOLLOW_UP);

    expect(answer).toMatchObject({ message: "Clicks rose.", mode: "model" });
    expect(generate).toHaveBeenCalledTimes(1);
    const request = generate.mock.calls[0]?.[0];
    expect(request?.tools).toEqual([]);
    expect(request?.maxTokens).toBe(FOLLOW_UP_MAX_TOKENS);
    expect(request?.messages[0]?.content).toContain("Answer the user's latest message directly");
    expect(request?.messages[0]?.content).toContain("Today is 2026-10-20");
    expect(request?.messages[1]).toEqual({ role: "user", content: "earlier question" });
    expect(request?.messages[2]).toEqual({ role: "assistant", content: "earlier answer" });
    expect(request?.messages[3]?.content).toContain("Question: why?");
    expect(request?.messages[3]?.content).toContain('"leads":7');
  });

  it("sends questions in another script to the model, which replies in that language", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply("ok"));
    const answer = await answerWithAi("كيف الأداء؟", { generate, execute: okData }, NOW);
    expect(answer.mode).toBe("model");
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty model reply on a follow-up", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) => textReply(""));
    await expect(answerWithAi("q", { generate, execute: okData }, NOW, undefined, FOLLOW_UP)).rejects.toMatchObject({
      reason: "invalid_response",
    });
  });
});

describe("tryAnswerWithAi fallback", () => {
  // Follow-up turn: the model path runs (first questions are answered by the code-built brief).
  const FOLLOW_UP = [{ query: "earlier question", answer: "earlier answer" }];
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
      Date.now(),
      undefined,
      FOLLOW_UP,
    );
    expect(result).toBeNull();
  });

  it("opens the breaker after repeated failures and skips the provider", async () => {
    const generate = vi.fn(async () => {
      throw new AssistantAiError("timeout");
    });
    const now = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      await tryAnswerWithAi("q", deps(generate), now, undefined, FOLLOW_UP);
    }
    expect(aiBreakerOpen(now)).toBe(true);

    generate.mockClear();
    expect(await tryAnswerWithAi("q", deps(generate), now + 1000, undefined, FOLLOW_UP)).toBeNull();
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
      Date.now(),
      undefined,
      FOLLOW_UP,
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

describe("answerWithAi follow-up grounding", () => {
  const NOW = new Date("2026-10-20T10:00:00Z");
  const data = async (_name: string, _args: unknown) => ({ ok: true as const, data: { gsc: { impressions: 3 } } });

  it("replaces an ungrounded follow-up with a short note and the brief", async () => {
    const generate = vi.fn(async (_request: TChatRequest, _onToken?: (text: string) => void) =>
      textReply("Impressions fell from 9000 to 0."),
    );
    const answer = await answerWithAi("why?", { generate, execute: data }, NOW, undefined, [
      { query: "q", answer: "earlier" },
    ]);
    expect(answer.mode).toBe("brief");
    expect(answer.message.startsWith("The project data does not explain this.")).toBe(true);
    expect(answer.message).not.toContain("9000");
  });
});
