import { describe, expect, it } from "vitest";
import { defineSubagents } from "./subagents.ts";

describe("defineSubagents", () => {
  it("should return subagents definition when valid", () => {
    const def = defineSubagents({
      agents: {
        "code-reviewer": {
          description: "Reviews code for quality and correctness",
          invocation: "delegate",
          instructions: "./agents/code-reviewer.md",
          model: "claude-sonnet-4",
        },
      },
    });

    expect(def.agents["code-reviewer"]).toBeDefined();
    expect(def.agents["code-reviewer"]!.invocation).toBe("delegate");
  });

  it("should accept multiple subagents", () => {
    const def = defineSubagents({
      agents: {
        reviewer: {
          description: "Code reviewer",
          instructions: "./agents/reviewer.md",
        },
        tester: {
          description: "Test writer",
          instructions: "./agents/tester.md",
          invocation: "automatic",
        },
        architect: {
          description: "Architecture advisor",
          instructions: "./agents/architect.md",
          invocation: "manual",
        },
      },
    });

    expect(Object.keys(def.agents)).toHaveLength(3);
  });

  it("should accept handoff configuration", () => {
    const def = defineSubagents({
      agents: {
        specialist: {
          description: "Domain specialist",
          instructions: "./agents/specialist.md",
          handoff: {
            allowedFrom: ["orchestrator"],
            returnMode: "report",
          },
        },
      },
    });

    expect(def.agents["specialist"]!.handoff!.returnMode).toBe("report");
  });

  it("should reject empty agents", () => {
    expect(() => defineSubagents({ agents: {} })).toThrow();
  });

  it("should reject missing instructions path", () => {
    expect(() =>
      defineSubagents({
        agents: {
          "bad-agent": {
            description: "Missing instructions",
            instructions: "",
          },
        },
      }),
    ).toThrow();
  });

  it("should reject subagent names with uppercase", () => {
    expect(() =>
      defineSubagents({
        agents: {
          BadName: {
            description: "Test",
            instructions: "./test.md",
          },
        },
      }),
    ).toThrow();
  });

  it("should reject subagent names with underscores", () => {
    expect(() =>
      defineSubagents({
        agents: {
          bad_name: {
            description: "Test",
            instructions: "./test.md",
          },
        },
      }),
    ).toThrow();
  });

  it("should accept subagent with all invocation types", () => {
    const invocations = ["manual", "delegate", "automatic"] as const;
    for (const invocation of invocations) {
      const def = defineSubagents({
        agents: {
          "test-agent": {
            description: "Test",
            instructions: "./test.md",
            invocation,
          },
        },
      });
      expect(def.agents["test-agent"]!.invocation).toBe(invocation);
    }
  });

  it("should accept all returnMode values", () => {
    const modes = ["report", "patch", "continue"] as const;
    for (const returnMode of modes) {
      const def = defineSubagents({
        agents: {
          "test-agent": {
            description: "Test",
            instructions: "./test.md",
            handoff: { returnMode },
          },
        },
      });
      expect(def.agents["test-agent"]!.handoff!.returnMode).toBe(returnMode);
    }
  });

  it("should accept subagent with model override", () => {
    const def = defineSubagents({
      agents: {
        "fast-agent": {
          description: "Fast agent",
          instructions: "./fast.md",
          model: "claude-sonnet-4",
        },
      },
    });
    expect(def.agents["fast-agent"]!.model).toBe("claude-sonnet-4");
  });

  it("should accept subagent with tags", () => {
    const def = defineSubagents({
      agents: {
        "tagged-agent": {
          description: "Tagged agent",
          instructions: "./tagged.md",
          tags: ["review", "quality"],
        },
      },
    });
    expect(def.agents["tagged-agent"]!.tags).toHaveLength(2);
  });

  it("should accept subagent with metadata", () => {
    const def = defineSubagents({
      agents: {
        "meta-agent": {
          description: "Agent with metadata",
          instructions: "./meta.md",
          metadata: { team: "platform", priority: "high" },
        },
      },
    });
    expect(def.agents["meta-agent"]!.metadata!.team).toBe("platform");
  });

  it("should accept specVersion", () => {
    const def = defineSubagents({
      specVersion: "1.0.0",
      agents: {
        test: {
          description: "Test",
          instructions: "./test.md",
        },
      },
    });
    expect(def.specVersion).toBe("1.0.0");
  });

  it("should accept handoff with allowedFrom list", () => {
    const def = defineSubagents({
      agents: {
        "restricted-agent": {
          description: "Restricted agent",
          instructions: "./restricted.md",
          handoff: {
            allowedFrom: ["orchestrator", "lead-agent", "manager"],
          },
        },
      },
    });
    expect(def.agents["restricted-agent"]!.handoff!.allowedFrom).toHaveLength(3);
  });

  it("should reject empty description", () => {
    expect(() =>
      defineSubagents({
        agents: {
          test: {
            description: "",
            instructions: "./test.md",
          },
        },
      }),
    ).toThrow();
  });
});
