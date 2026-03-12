import { describe, expect, it } from "vitest";
import { packageSchema } from "./package.ts";

describe("packageSchema", () => {
  const validPackage = {
    name: "github-workflow",
    version: "2.0.0",
    description: "GitHub workflow package",
  };

  it("should validate a minimal valid package", () => {
    const result = packageSchema.safeParse(validPackage);
    expect(result.success).toBe(true);
  });

  it("should reject name with uppercase letters", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "BadName" });
    expect(result.success).toBe(false);
  });

  it("should reject name with underscores", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "bad_name" });
    expect(result.success).toBe(false);
  });

  it("should enforce name regex: ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$", () => {
    const valid = ["a", "ab", "my-package", "pkg-123", "a1b2c3"];
    const invalid = ["-start", "end-", "UPPER", "under_score", "", "a".repeat(64)];

    for (const name of valid) {
      const result = packageSchema.safeParse({ ...validPackage, name });
      expect(result.success, `Expected "${name}" to be valid`).toBe(true);
    }

    for (const name of invalid) {
      const result = packageSchema.safeParse({ ...validPackage, name });
      expect(result.success, `Expected "${name}" to be invalid`).toBe(false);
    }
  });

  it("should reject invalid semver version", () => {
    const result = packageSchema.safeParse({ ...validPackage, version: "1.0" });
    expect(result.success).toBe(false);
  });

  it("should require name field", () => {
    const { name: _, ...noName } = validPackage;
    const result = packageSchema.safeParse(noName);
    expect(result.success).toBe(false);
  });

  it("should require version field", () => {
    const { version: _, ...noVersion } = validPackage;
    const result = packageSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it("should require description field", () => {
    const { description: _, ...noDesc } = validPackage;
    const result = packageSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });

  it("should accept optional layer paths", () => {
    const result = packageSchema.safeParse({
      ...validPackage,
      mcp: "./mcp.ts",
      skills: "./skills/",
      rules: "./rules/",
      knowledge: "./knowledge/",
      surfaces: "./surfaces/",
      secrets: "./secrets.ts",
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional tags as string array", () => {
    const result = packageSchema.safeParse({
      ...validPackage,
      tags: ["workflow", "github", "ci-cd"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject tags with duplicate values", () => {
    const result = packageSchema.safeParse({
      ...validPackage,
      tags: ["workflow", "workflow"],
    });
    expect(result.success).toBe(false);
  });

  it("should accept specVersion field", () => {
    const result = packageSchema.safeParse({
      ...validPackage,
      specVersion: "1.0.0",
    });
    expect(result.success).toBe(true);
  });

  it("should accept package references", () => {
    const result = packageSchema.safeParse({
      ...validPackage,
      packages: ["ghcr.io/myorg/packages/base:1.0.0", "./local-pkg"],
    });
    expect(result.success).toBe(true);
  });

  it("should not require adapter field (unlike agent)", () => {
    const result = packageSchema.safeParse(validPackage);
    expect(result.success).toBe(true);
  });

  it("should reject empty description", () => {
    const result = packageSchema.safeParse({ ...validPackage, description: "" });
    expect(result.success).toBe(false);
  });

  it("should reject names starting with hyphen", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "-bad" });
    expect(result.success).toBe(false);
  });

  it("should reject names ending with hyphen", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "bad-" });
    expect(result.success).toBe(false);
  });

  it("should reject names longer than 63 characters", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "a".repeat(64) });
    expect(result.success).toBe(false);
  });

  it("should accept single character name", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "a" });
    expect(result.success).toBe(true);
  });

  it("should accept two character name", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "ab" });
    expect(result.success).toBe(true);
  });

  it("should accept 63 character name", () => {
    const result = packageSchema.safeParse({ ...validPackage, name: "a".repeat(63) });
    expect(result.success).toBe(true);
  });
});
