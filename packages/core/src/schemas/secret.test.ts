import { describe, expect, it } from "vitest";
import { secretSchema } from "./secret.ts";

describe("secretSchema", () => {
  it("should validate minimal secret declaration", () => {
    const result = secretSchema.safeParse({
      key: "API_KEY",
      required: true,
    });
    expect(result.success).toBe(true);
  });

  it("should require key field", () => {
    const result = secretSchema.safeParse({ required: true });
    expect(result.success).toBe(false);
  });

  it("should require required field", () => {
    const result = secretSchema.safeParse({ key: "API_KEY" });
    expect(result.success).toBe(false);
  });

  it("should reject empty key", () => {
    const result = secretSchema.safeParse({ key: "", required: true });
    expect(result.success).toBe(false);
  });

  it("should accept optional description", () => {
    const result = secretSchema.safeParse({
      key: "API_KEY",
      required: true,
      description: "The API key for external service",
    });
    expect(result.success).toBe(true);
  });

  it("should accept all valid kind values", () => {
    const kinds = [
      "api-key",
      "token",
      "password",
      "certificate",
      "connection-string",
      "url",
      "opaque",
    ];
    for (const kind of kinds) {
      const result = secretSchema.safeParse({
        key: "SECRET",
        required: true,
        kind,
      });
      expect(result.success, `Expected kind "${kind}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid kind value", () => {
    const result = secretSchema.safeParse({
      key: "SECRET",
      required: true,
      kind: "invalid-kind",
    });
    expect(result.success).toBe(false);
  });

  it("should accept exposeAs with env", () => {
    const result = secretSchema.safeParse({
      key: "API_KEY",
      required: true,
      exposeAs: { env: "MY_API_KEY" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept exposeAs with file", () => {
    const result = secretSchema.safeParse({
      key: "CERT",
      required: true,
      exposeAs: { file: "/etc/ssl/cert.pem" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept exposeAs with both env and file", () => {
    const result = secretSchema.safeParse({
      key: "TOKEN",
      required: true,
      exposeAs: { env: "TOKEN", file: "/run/secrets/token" },
    });
    expect(result.success).toBe(true);
  });

  it("should accept required: false", () => {
    const result = secretSchema.safeParse({
      key: "OPTIONAL_KEY",
      required: false,
    });
    expect(result.success).toBe(true);
  });

  it("should accept full secret declaration", () => {
    const result = secretSchema.safeParse({
      key: "ANTHROPIC_API_KEY",
      required: true,
      description: "Anthropic API key for Claude access",
      kind: "api-key",
      exposeAs: { env: "ANTHROPIC_API_KEY" },
    });
    expect(result.success).toBe(true);
  });
});
