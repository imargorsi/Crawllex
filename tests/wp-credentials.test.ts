import { describe, expect, it } from "vitest";

import { decryptLeadSourceKey, encryptLeadSourceKey } from "@/lib/leads/lead-source-key";
import { ingestVerifySchema } from "@/schemas/lead";

describe("WordPress application password storage", () => {
  it("round-trips the password through AES-GCM and never stores it plain", () => {
    const password = "abcd EFGH ijkl MNOP qrst UVWX";
    const payload = encryptLeadSourceKey(password);
    expect(payload).not.toContain(password);
    expect(payload.startsWith("v1.")).toBe(true);
    expect(decryptLeadSourceKey(payload)).toBe(password);
  });

  it("rejects a tampered payload", () => {
    const payload = encryptLeadSourceKey("secret-value");
    const parts = payload.split(".");
    parts[3] = parts[3]!.slice(0, -2) + (parts[3]!.endsWith("AA") ? "BB" : "AA");
    expect(decryptLeadSourceKey(parts.join("."))).toBeNull();
  });

  it("verify schema accepts optional wpCredentials and still accepts verify without them", () => {
    const withCreds = ingestVerifySchema.parse({
      pluginVersion: "0.4.3",
      siteUrl: "https://example.com",
      wpCredentials: {
        username: "admin",
        applicationPassword: "abcd EFGH ijkl MNOP qrst UVWX",
        applicationPasswordUuid: "9f1c2a3e-0000-4000-8000-000000000000",
      },
    });
    expect(withCreds.wpCredentials?.username).toBe("admin");

    const plain = ingestVerifySchema.parse({ pluginVersion: "0.4.2" });
    expect(plain.wpCredentials).toBeUndefined();
  });

  it("verify schema rejects wpCredentials with missing fields", () => {
    expect(() =>
      ingestVerifySchema.parse({ pluginVersion: "0.4.3", wpCredentials: { username: "admin" } }),
    ).toThrow();
  });
});
