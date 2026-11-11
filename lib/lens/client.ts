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
  const response = await lensRequest(path);
  const data: unknown = await response.json().catch(() => null);
  if (data == null || typeof data !== "object") throw new LensError("invalid_response");
  return data as T;
}

async function lensRequest(path: string): Promise<Response> {
  const config = lensConfig();
  if (!config) throw new LensError("disabled");

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/v1/${path}`, {
      headers: { Authorization: `Bearer ${config.token}` },
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
