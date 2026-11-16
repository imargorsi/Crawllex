import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enrollLensProject, queueLensRun, getLensSchedule, setLensFrequency } from "@/lib/lens/actions";
import { LENS_FREQUENCY_MINUTES, frequencyFromMinutes } from "@/lib/lens/schedule";

const TOKEN = "lens-test-token-value";
const PROJECT = { id: "6a84511a25c08c7425ecee35", businessName: "Client", websiteUrl: "https://client.example/", status: "active" };

beforeEach(() => {
  const tokenFile = path.join(mkdtempSync(path.join(os.tmpdir(), "lens-")), "token");
  writeFileSync(tokenFile, `${TOKEN}\n`);
  process.env.LENS_API_URL = "http://127.0.0.1:3025";
  process.env.LENS_API_TOKEN_FILE = tokenFile;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("enrollLensProject", () => {
  it("posts project fields with the bearer token and reports a queued first run", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ enrolled: true, firstRun: { jobId: "j1" } }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await enrollLensProject(PROJECT);

    expect(result).toEqual({ firstRunQueued: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`http://127.0.0.1:3025/v1/projects/${PROJECT.id}/enroll`);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(String(init.body))).toEqual({ name: "Client", websiteUrl: "https://client.example/", status: "active" });
  });

  it("reports no queued run when the project already had runs", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ enrolled: true, firstRun: null }), { status: 200 })));
    expect(await enrollLensProject(PROJECT)).toEqual({ firstRunQueued: false });
  });
});

describe("queueLensRun", () => {
  it("queues a run only; enrollment is a separate super admin action", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ jobId: "j2", status: "queued", created: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const job = await queueLensRun(PROJECT);

    expect(job).toEqual({ jobId: "j2", status: "queued", created: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/runs$/);
    expect(init.method).toBe("POST");
  });
});

describe("Lens audit frequency", () => {
  it("maps each frequency to minutes and back", () => {
    expect(LENS_FREQUENCY_MINUTES).toEqual({ weekly: 10080, twice_monthly: 21600, monthly: 43200 });
    expect(frequencyFromMinutes(43200)).toBe("monthly");
    expect(frequencyFromMinutes(21600)).toBe("twice_monthly");
    expect(frequencyFromMinutes(10080)).toBe("weekly");
    expect(frequencyFromMinutes(60)).toBeNull();
    expect(frequencyFromMinutes(null)).toBeNull();
  });

  it("reads the schedule from Lens", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ intervalMinutes: 43200, enabled: true, nextRunAt: 1795000000000 }), { status: 200 })));
    expect(await getLensSchedule(PROJECT.id)).toEqual({ frequency: "monthly", enabled: true, nextRunAt: new Date(1795000000000).toISOString() });
  });

  it("reports no frequency when Lens has no schedule", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ intervalMinutes: null, enabled: false }), { status: 200 })));
    expect(await getLensSchedule(PROJECT.id)).toEqual({ frequency: null, enabled: false, nextRunAt: null });
  });

  it("puts the chosen frequency as minutes, enabled", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ intervalMinutes: 10080, enabled: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await setLensFrequency(PROJECT.id, "weekly");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`http://127.0.0.1:3025/v1/projects/${PROJECT.id}/schedule`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ intervalMinutes: 10080, enabled: true });
  });
});
