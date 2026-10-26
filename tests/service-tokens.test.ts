import { afterEach, describe, expect, it } from "vitest";
import { createAccessToken, createServiceAccessToken, findAccessToken } from "@/lib/auth/tokens";
import { AccessToken, User } from "@/models";

const ORIGINAL = process.env.CRAWLEX_SERVICE_TOKENS_ENABLED;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRAWLEX_SERVICE_TOKENS_ENABLED;
  else process.env.CRAWLEX_SERVICE_TOKENS_ENABLED = ORIGINAL;
});

async function makeUser(email: string) {
  return User.create({ name: "Svc", email, password: null, emailVerifiedAt: new Date(), roles: [] });
}

describe("service tokens", () => {
  it("normal tokens still expire after 24h", async () => {
    const user = await makeUser("normal@example.com");
    const token = await createAccessToken(user._id, "api");
    const record = await AccessToken.findById(token.split("|")[0]);
    expect(record?.expiresAt).toBeInstanceOf(Date);
    expect(record?.serviceToken).toBe(false);
  });

  it("refuses to issue when disabled", async () => {
    delete process.env.CRAWLEX_SERVICE_TOKENS_ENABLED;
    const user = await makeUser("off@example.com");
    await expect(createServiceAccessToken(user._id, "lens")).rejects.toThrow(/disabled/);
  });

  it("issues non-expiring token that authenticates when enabled", async () => {
    process.env.CRAWLEX_SERVICE_TOKENS_ENABLED = "true";
    const user = await makeUser("on@example.com");
    const token = await createServiceAccessToken(user._id, "lens");
    const record = await AccessToken.findById(token.split("|")[0]);
    expect(record?.expiresAt).toBeNull();
    expect(record?.serviceToken).toBe(true);
    expect(await findAccessToken(token)).not.toBeNull();
  });

  it("rejects service token when flag is off, without deleting it", async () => {
    process.env.CRAWLEX_SERVICE_TOKENS_ENABLED = "true";
    const user = await makeUser("flag@example.com");
    const token = await createServiceAccessToken(user._id, "lens");
    delete process.env.CRAWLEX_SERVICE_TOKENS_ENABLED;
    expect(await findAccessToken(token)).toBeNull();
    expect(await AccessToken.findById(token.split("|")[0])).not.toBeNull();
  });
});
