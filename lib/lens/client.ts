import { lensConfig } from "./config";

export const LENS_TIMEOUT_MS = 8_000;

export class LensError extends Error {
  readonly reason: "disabled" | "timeout" | "not_found" | "http" | "invalid_response";
  readonly status?: number;
  constructor(reason: LensError["reason"], status?: number) {
    super(`Lens failed: ${reason}${status ? ` (${status})` : ""}.`);
    this.name = "LensError";
    this.reason = reason;
    this.status = status;
  }
}

/** Path segments are encoded one by one, so a slash in a value cannot change the route. */
export function lensPath(...segments: string[]): string {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

/** GET one JSON document from the Lens local API. Never logs the token or the body. */
export async function lensGet<T>(path: string): Promise<T> {
  return readJson<T>(await lensRequest(path));
}

/** POST a JSON body to the Lens local API and read the JSON reply. Used for enrollment and queued runs. */
export async function lensPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  return readJson<T>(await lensRequest(path, { method: "POST", body }));
}

/** Cloudflare Access service token headers. Empty when not configured (local loopback). Never logged. */
function accessServiceHeaders(): Record<string, string> {
  const id = process.env.CF_ACCESS_CLIENT_ID?.trim();
  const secret = process.env.CF_ACCESS_CLIENT_SECRET?.trim();
  if (!id || !secret) return {};
  return { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret };
}

async function readJson<T>(response: Response): Promise<T> {
  const data: unknown = await response.json().catch(() => null);
  if (data == null || typeof data !== "object") throw new LensError("invalid_response");
  return data as T;
}

async function lensRequest(path: string, init: { method?: "POST"; body?: Record<string, unknown> } = {}): Promise<Response> {
  const config = lensConfig();
  if (!config) throw new LensError("disabled");

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/v1/${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        // Cloudflare Access service token, when Lens is behind Access (lens.logicalcreations.cloud).
        ...accessServiceHeaders(),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(LENS_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new LensError("timeout");
    }
    throw new LensError("http");
  }
  if (response.status === 404 || response.status === 403) throw new LensError("not_found", response.status);
  if (!response.ok) throw new LensError("http", response.status);
  return response;
}
