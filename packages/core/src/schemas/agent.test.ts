import { describe, expect, it } from "vitest";
import { agentSchema } from "./agent.ts";

describe("agentSchema", () => {
  const validAgent = {
    name: "test-agent",
    version: "1.0.0",
    description: "A test agent",
    adapter: {
      type: "claude-code",
      runtime: "claude-code",
      adapterVersion: "1.0.0",
      config: {},
      features: {},
    },
  };

  it("should validate a minimal valid agent", () => {
    const result = agentSchema.safeParse(validAgent);
    expect(result.success).toBe(true);
  });

  it("should reject name with uppercase letters", () => {
    const result = agentSchema.safeParse({ ...validAgent, name: "BadName" });
    expect(result.success).toBe(false);
  });

  it("should reject name with underscores", () => {
    const result = agentSchema.safeParse({ ...validAgent, name: "bad_name" });
    expect(result.success).toBe(false);
  });

  it("should enforce name regex: ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$", () => {
    const valid = ["a", "ab", "my-agent", "agent-123", "a1b2c3"];
    const invalid = ["-start", "end-", "UPPER", "under_score", "", "a".repeat(64)];

    for (const name of valid) {
      const result = agentSchema.safeParse({ ...validAgent, name });
      expect(result.success, `Expected "${name}" to be valid`).toBe(true);
    }

    for (const name of invalid) {
      const result = agentSchema.safeParse({ ...validAgent, name });
      expect(result.success, `Expected "${name}" to be invalid`).toBe(false);
    }
  });

  it("should reject invalid semver version", () => {
    const result = agentSchema.safeParse({ ...validAgent, version: "1.0" });
    expect(result.success).toBe(false);
  });

  it("should require description", () => {
    const { description: _, ...noDesc } = validAgent;
    const result = agentSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });

  it("should require adapter", () => {
    const { adapter: _, ...noAdapter } = validAgent;
    const result = agentSchema.safeParse(noAdapter);
    expect(result.success).toBe(false);
  });
});
