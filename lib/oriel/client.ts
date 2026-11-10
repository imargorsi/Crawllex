import { ORIEL_TIMEOUT_MS, orielApiConfig } from "./config";

export class OrielError extends Error {
  readonly reason: "disabled" | "timeout" | "http" | "invalid_response";
  readonly status?: number;
  constructor(reason: OrielError["reason"], status?: number) {
    super(`Oriel failed: ${reason}${status ? ` (${status})` : ""}.`);
    this.name = "OrielError";
    this.reason = reason;
    this.status = status;
  }
}

/** One chat call to the Oriel API on logibox (tailnet). Never logs the key, the question or the answer. */
export async function callOriel(content: string): Promise<string> {
  const config = orielApiConfig();
  if (!config) throw new OrielError("disabled");

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({ model: "hermes-agent", messages: [{ role: "user", content }] }),
      redirect: "error",
      signal: AbortSignal.timeout(ORIEL_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new OrielError("timeout");
    }
    throw new OrielError("http");
  }
  if (!response.ok) throw new OrielError("http", response.status);

  const data: unknown = await response.json().catch(() => null);
  const text = extractContent(data);
  if (!text) throw new OrielError("invalid_response");
  return text;
}

function extractContent(data: unknown): string | null {
  if (typeof data !== "object" || data == null || !("choices" in data)) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const content = (choices[0] as { message?: { content?: unknown } })?.message?.content;
  return typeof content === "string" && content.trim() ? content : null;
}
