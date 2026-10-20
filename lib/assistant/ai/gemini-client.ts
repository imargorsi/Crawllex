export const GEMINI_TIMEOUT_MS = 25_000;
export const GEMINI_RATE_LIMIT_RETRY_MS = 2_000;
const DEFAULT_MODEL = "gemini-3.5-flash";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

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

export type TGeminiPart = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: Record<string, unknown>; id?: string };
  thoughtSignature?: string;
};

export type TGeminiContent = {
  role: "user" | "model";
  parts: TGeminiPart[];
};

export type TGeminiRequest = {
  systemInstruction: { parts: Array<{ text: string }> };
  contents: TGeminiContent[];
  tools: Array<{
    functionDeclarations: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  }>;
};

export function geminiModelId(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

const THINKING_LEVELS = ["minimal", "low", "medium", "high"] as const;

/** Optional thinking level (`GEMINI_THINKING_LEVEL`). Unset = model default. Lower = faster answers. */
export function geminiThinkingConfig(): { thinkingLevel: (typeof THINKING_LEVELS)[number] } | null {
  const level = process.env.GEMINI_THINKING_LEVEL?.trim();
  if (!level) return null;
  if (!(THINKING_LEVELS as readonly string[]).includes(level)) return null;
  return { thinkingLevel: level as (typeof THINKING_LEVELS)[number] };
}

/**
 * One generateContent call. Returns the model's content (kept verbatim so
 * thought signatures survive the round trip). Never logs the key or the body.
 */
export async function generateGeminiContent(request: TGeminiRequest): Promise<TGeminiContent> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new AssistantAiError("disabled");

  let response = await postGenerateContent(request, apiKey);
  if (response.status === 429) {
    // Free-tier per-minute limit. One short retry, then give up and let the caller fall back.
    await new Promise((resolve) => setTimeout(resolve, GEMINI_RATE_LIMIT_RETRY_MS));
    response = await postGenerateContent(request, apiKey);
  }

  if (!response.ok) throw new AssistantAiError("http", response.status);

  const data: unknown = await response.json().catch(() => null);
  const content = extractContent(data);
  if (!content) throw new AssistantAiError("invalid_response");
  return content;
}

async function postGenerateContent(request: TGeminiRequest, apiKey: string): Promise<Response> {
  try {
    return await fetch(`${ENDPOINT}/${geminiModelId()}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        ...request,
        generationConfig: {
          temperature: 0,
          ...(geminiThinkingConfig() ? { thinkingConfig: geminiThinkingConfig() } : {}),
        },
      }),
      redirect: "error",
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new AssistantAiError("timeout");
    }
    throw new AssistantAiError("http");
  }
}

function extractContent(data: unknown): TGeminiContent | null {
  if (typeof data !== "object" || data == null || !("candidates" in data)) return null;
  const candidates = (data as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const content = (candidates[0] as { content?: unknown })?.content;
  if (typeof content !== "object" || content == null) return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  return { role: "model", parts: parts as TGeminiPart[] };
}
