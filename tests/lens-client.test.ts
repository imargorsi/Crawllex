import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { lensGet, lensPath, LensError } from "@/lib/lens/client";
import { lensConfig } from "@/lib/lens/config";

const TOKEN = "lens-test-token-value";
let tokenFile: string;

beforeEach(() => {
  tokenFile = path.join(mkdtempSync(path.join(os.tmpdir(), "lens-")), "token");
  writeFileSync(tokenFile, `${TOKEN}\n`);
  process.env.LENS_API_URL = "http://127.0.0.1:3025";
  process.env.LENS_API_TOKEN_FILE = tokenFile;
});

afterEach(() => {
  delete process.env.LENS_API_URL;
  delete process.env.LENS_API_TOKEN_FILE;
  vi.unstubAllGlobals();
});

describe("lensConfig", () => {
  it("reads the local URL and the token from the file", () => {
    expect(lensConfig()).toEqual({ baseUrl: "http://127.0.0.1:3025", token: TOKEN });
  });

  it("is off when either setting is missing", () => {
    delete process.env.LENS_API_URL;
    expect(lensConfig()).toBeNull();
  });

  it("refuses a remote address that is not https", () => {
    process.env.LENS_API_URL = "http://lens.example.com";
    expect(lensConfig()).toBeNull();
    process.env.LENS_API_URL = "https://lens.example.com";
    expect(lensConfig()).toEqual({ baseUrl: "https://lens.example.com", token: TOKEN });
  });

  it("refuses a URL that carries credentials or a query", () => {
    process.env.LENS_API_URL = "http://user:pass@127.0.0.1:3025";
    expect(lensConfig()).toBeNull();
    process.env.LENS_API_URL = "http://127.0.0.1:3025/?x=1";
    expect(lensConfig()).toBeNull();
  });
});

describe("lensGet", () => {
  it("sends the bearer token to the local API and returns the JSON body", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ items: [{ id: "run-1" }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const body = await lensGet<{ items: { id: string }[] }>("projects/p1/runs");
    expect(body.items[0]?.id).toBe("run-1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://127.0.0.1:3025/v1/projects/p1/runs");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(init.redirect).toBe("error");
  });

  it("maps 403 and 404 to not_found, other failures to http", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 403 })));
    await expect(lensGet("projects/p2/runs")).rejects.toMatchObject({ reason: "not_found", status: 403 });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    await expect(lensGet("projects/p1/runs")).rejects.toMatchObject({ reason: "http", status: 500 });
  });

  it("reports disabled when Lens is not configured", async () => {
    delete process.env.LENS_API_URL;
    await expect(lensGet("projects/p1/runs")).rejects.toBeInstanceOf(LensError);
  });

  it("encodes each path segment so a value cannot change the route", () => {
    expect(lensPath("projects", "a/b", "runs")).toBe("projects/a%2Fb/runs");
  });
});
