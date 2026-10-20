export const OPENROUTER_TIMEOUT_MS = 25_000;
export const OPENROUTER_RATE_LIMIT_RETRY_MS = 2_000;
const DEFAULT_MODEL = "dots-studio/dots-3-note-preview:free";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

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
};

export type TAssistantMessage = {
  content: string | null;
  tool_calls?: TToolCall[];
};

export function openRouterModelId(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

export function openRouterApiKey(): string | null {
  return process.env.OPENROUTER_API_KEY?.trim() || null;
}

/**
 * One OpenAI-compatible chat completion on OpenRouter. Returns the assistant message verbatim.
 * Never logs the key or the response body.
 */
export async function generateChatCompletion(request: TChatRequest): Promise<TAssistantMessage> {
  const apiKey = openRouterApiKey();
  if (!apiKey) throw new AssistantAiError("disabled");

  let response = await postCompletion(request, apiKey);
  if (response.status === 429) {
    // Free-tier upstream rate limit. One short retry, then let the caller fall back.
    await new Promise((resolve) => setTimeout(resolve, OPENROUTER_RATE_LIMIT_RETRY_MS));
    response = await postCompletion(request, apiKey);
  }

  if (!response.ok) throw new AssistantAiError("http", response.status);

  const data: unknown = await response.json().catch(() => null);
  const message = extractMessage(data);
  if (!message) throw new AssistantAiError("invalid_response");
  return message;
}

async function postCompletion(request: TChatRequest, apiKey: string): Promise<Response> {
  const body = {
    model: openRouterModelId(),
    temperature: 0,
    max_tokens: 1024,
    messages: request.messages,
    tools: request.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    })),
  };

  try {
    return await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Title": "Crawllex",
      },
      body: JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AssistantAiError("timeout");
    }
    throw new AssistantAiError("http");
  }
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
