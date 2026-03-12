import { describe, expect, it } from "vitest";
import { subagentsSchema } from "./subagents.ts";

describe("subagentsSchema", () => {
  const validSubagents = {
    agents: {
      "code-reviewer": {
        description: "Reviews code for quality",
        instructions: "./agents/code-reviewer.md",
      },
    },
  };

  it("should validate minimal valid subagents", () => {
    const result = subagentsSchema.safeParse(validSubagents);
    expect(result.success).toBe(true);
  });

  it("should require agents field", () => {
    const result = subagentsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("should reject empty agents object", () => {
    const result = subagentsSchema.safeParse({ agents: {} });
    expect(result.success).toBe(false);
  });

  it("should enforce subagent name matching agent name rules", () => {
    const valid = ["reviewer", "code-reviewer", "test-agent-123"];
    const invalid = ["-start", "end-", "UPPER", "under_score"];

    for (const name of valid) {
      const result = subagentsSchema.safeParse({
        agents: {
          [name]: {
            description: "Test",
            instructions: "./test.md",
          },
        },
      });
      expect(result.success, `Expected "${name}" to be valid`).toBe(true);
    }

    for (const name of invalid) {
      const result = subagentsSchema.safeParse({
        agents: {
          [name]: {
            description: "Test",
            instructions: "./test.md",
          },
        },
      });
      expect(result.success, `Expected "${name}" to be invalid`).toBe(false);
    }
  });

  it("should require description for each subagent", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        reviewer: {
          instructions: "./agents/reviewer.md",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should require instructions for each subagent", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        reviewer: {
          description: "Code reviewer",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty instructions path", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        reviewer: {
          description: "Code reviewer",
          instructions: "",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept valid invocation values", () => {
    const invocations = ["manual", "delegate", "automatic"];
    for (const invocation of invocations) {
      const result = subagentsSchema.safeParse({
        agents: {
          test: {
            description: "Test",
            instructions: "./test.md",
            invocation,
          },
        },
      });
      expect(result.success, `Expected invocation "${invocation}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid invocation value", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
          invocation: "unknown",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept handoff configuration", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        specialist: {
          description: "Specialist",
          instructions: "./specialist.md",
          handoff: {
            allowedFrom: ["orchestrator", "lead"],
            returnMode: "report",
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept valid returnMode values", () => {
    const modes = ["report", "patch", "continue"];
    for (const returnMode of modes) {
      const result = subagentsSchema.safeParse({
        agents: {
          test: {
            description: "Test",
            instructions: "./test.md",
            handoff: { returnMode },
          },
        },
      });
      expect(result.success, `Expected returnMode "${returnMode}" to be valid`).toBe(true);
    }
  });

  it("should reject invalid returnMode", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
          handoff: { returnMode: "invalid" },
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("should accept multiple subagents", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        reviewer: {
          description: "Code reviewer",
          instructions: "./agents/reviewer.md",
          invocation: "delegate",
        },
        tester: {
          description: "Test writer",
          instructions: "./agents/tester.md",
          invocation: "automatic",
        },
        architect: {
          description: "Architect",
          instructions: "./agents/architect.md",
          invocation: "manual",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional model field", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
          model: "claude-sonnet-4",
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional tags", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
          tags: ["code-review", "quality"],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept optional metadata", () => {
    const result = subagentsSchema.safeParse({
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
          metadata: { team: "platform", priority: "high" },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("should accept specVersion field", () => {
    const result = subagentsSchema.safeParse({
      ...validSubagents,
      specVersion: "1.0.0",
    });
    expect(result.success).toBe(true);
  });
});
