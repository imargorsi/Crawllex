// Local model on logibox (Qwen3-1.7B via llama-server behind Caddy basic auth), reached over Tailscale.
// Tailscale encrypts the link; basic auth is still required by the gateway.
export const LLM_TIMEOUT_MS = 180_000;
const DEFAULT_MODEL = "qwen3-1.7b";

export type TAssistantAiFailure =
  | "disabled"
  | "timeout"
  | "http"
  | "invalid_response"
  | "tool_limit"
  | "circuit_open";

export class AssistantAiError extends Error {
  readonly reason: TAssistantAiFailure;
  readonly status?: number;

  constructor(reason: TAssistantAiFailure, status?: number) {
    super(`Assistant AI failed: ${reason}${status ? ` (${status})` : ""}.`);
    this.name = "AssistantAiError";
    this.reason = reason;
    this.status = status;
  }
}

export type TToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type TChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: TToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type TToolDeclaration = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type TChatRequest = {
  messages: TChatMessage[];
  tools: TToolDeclaration[];
  /** Reply length cap in tokens. Default 300. */
  maxTokens?: number;
};

export type TAssistantMessage = {
  content: string | null;
  tool_calls?: TToolCall[];
};

export type TLlmConfig = { baseUrl: string; user: string; password: string; model: string };

/** Null when any required variable is missing. Env: LLM_BASE_URL, LLM_USER, LLM_PASSWORD, LLM_MODEL (optional). */
export function llmConfig(): TLlmConfig | null {
  const baseUrl = process.env.LLM_BASE_URL?.trim().replace(/\/+$/, "");
  const user = process.env.LLM_USER?.trim();
  const password = process.env.LLM_PASSWORD?.trim();
  if (!baseUrl || !user || !password) return null;
  return { baseUrl, user, password, model: process.env.LLM_MODEL?.trim() || DEFAULT_MODEL };
}

/**
 * One OpenAI-compatible chat completion on the local model. Returns the assistant message verbatim.
 * Never logs the password or the response body.
 */
export async function generateChatCompletion(
  request: TChatRequest,
  onToken?: (text: string) => void,
): Promise<TAssistantMessage> {
  const config = llmConfig();
  if (!config) throw new AssistantAiError("disabled");

  const response = await postCompletion(request, config, onToken !== undefined);
  if (!response.ok) throw new AssistantAiError("http", response.status);
  if (onToken) return readStreamedMessage(response, onToken);

  const data: unknown = await response.json().catch(() => null);
  const message = extractMessage(data);
  if (!message) throw new AssistantAiError("invalid_response");
  return message;
}

async function postCompletion(request: TChatRequest, config: TLlmConfig, stream: boolean): Promise<Response> {
  const body = {
    model: config.model,
    temperature: 0,
    // Short answers are faster on the local model (about 6 tokens/s). 300 covers the three-section format.
    max_tokens: request.maxTokens ?? 300,
    stream,
    // Reasoning is also off on the server; this keeps answers short and fast.
    chat_template_kwargs: { enable_thinking: false },
    messages: request.messages,
    ...(request.tools.length > 0
      ? {
          tools: request.tools.map((tool) => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: lowercaseSchemaTypes(tool.parameters),
            },
          })),
        }
      : {}),
  };

  const credentials = Buffer.from(`${config.user}:${config.password}`).toString("base64");

  try {
    return await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AssistantAiError("timeout");
    }
    throw new AssistantAiError("http");
  }
}

/**
 * Reads an OpenAI-style SSE stream. Text deltas go to `onToken` as they arrive; tool-call deltas are
 * joined by index. Returns the same message shape as the non-streaming call.
 */
async function readStreamedMessage(
  response: Response,
  onToken: (text: string) => void,
): Promise<TAssistantMessage> {
  if (!response.body) throw new AssistantAiError("invalid_response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  const calls = new Map<number, { id: string; name: string; args: string }>();

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        newline = buffer.indexOf("\n");
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        const delta = parseDelta(payload);
        if (!delta) continue;
        if (typeof delta.content === "string" && delta.content) {
          content += delta.content;
          onToken(delta.content);
        }
        for (const call of delta.tool_calls ?? []) {
          const current = calls.get(call.index ?? 0) ?? { id: "", name: "", args: "" };
          if (call.id) current.id = call.id;
          if (call.function?.name) current.name += call.function.name;
          if (call.function?.arguments) current.args += call.function.arguments;
          calls.set(call.index ?? 0, current);
        }
      }
    }
  } catch {
    throw new AssistantAiError("http");
  }

  const toolCalls: TToolCall[] = [...calls.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, call]) => ({
      id: call.id || `call_${index}`,
      type: "function" as const,
      function: { name: call.name, arguments: call.args },
    }))
    .filter((call) => call.function.name);

  if (!content.trim() && toolCalls.length === 0) throw new AssistantAiError("invalid_response");
  return { content: content || null, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
}

type TStreamDelta = {
  content?: string;
  tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string } }>;
};

function parseDelta(payload: string): TStreamDelta | null {
  try {
    const json = JSON.parse(payload) as { choices?: Array<{ delta?: TStreamDelta }> };
    return json.choices?.[0]?.delta ?? null;
  } catch {
    return null;
  }
}

/**
 * llama-server's template parser needs JSON Schema types in lowercase. The tool declarations use
 * Gemini-style uppercase ("OBJECT", "STRING", "INTEGER"), which it rejects with HTTP 400.
 */
export function lowercaseSchemaTypes<T>(schema: T): T {
  if (Array.isArray(schema)) return schema.map((item) => lowercaseSchemaTypes(item)) as T;
  if (typeof schema !== "object" || schema == null) return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    out[key] =
      key === "type" && typeof value === "string"
        ? value.toLowerCase()
        : lowercaseSchemaTypes(value);
  }
  return out as T;
}

function extractMessage(data: unknown): TAssistantMessage | null {
  if (typeof data !== "object" || data == null || !("choices" in data)) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const message = (choices[0] as { message?: unknown })?.message;
  if (typeof message !== "object" || message == null) return null;

  const { content, tool_calls: toolCalls } = message as {
    content?: unknown;
    tool_calls?: unknown;
  };
  const text = typeof content === "string" ? content : null;
  const calls = Array.isArray(toolCalls)
    ? (toolCalls as TToolCall[]).filter(
        (call) => typeof call?.id === "string" && typeof call?.function?.name === "string",
      )
    : [];
  if (!text?.trim() && calls.length === 0) return null;
  return { content: text, tool_calls: calls.length > 0 ? calls : undefined };
}
