import { describe, expect, it } from "vitest";
import type {
  MaterializeOptions,
  MaterializedSkill,
  MaterializedRule,
  MaterializedSurface,
  MaterializedSubagent,
  MaterializedWorkspaceSource,
  MaterializationWarning,
  InstallPlan,
  InstallAction,
  MaterializedInstructionNode,
} from "./types.ts";

describe("materialize types", () => {
  it("should define MaterializeOptions with required fields", () => {
    const opts: MaterializeOptions = {
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
    };
    expect(opts.source).toBeDefined();
    expect(opts.outDir).toBeDefined();
  });

  it("should define MaterializeOptions with optional fields", () => {
    const opts: MaterializeOptions = {
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
      adapter: "claude-code",
      exact: true,
    };
    expect(opts.adapter).toBe("claude-code");
    expect(opts.exact).toBe(true);
  });

  it("should define MaterializedSkill with required fields", () => {
    const skill: MaterializedSkill = {
      name: "code-review",
      path: "skills/code-review/SKILL.md",
      content: "Review code for quality",
    };
    expect(skill.name).toBeDefined();
    expect(skill.path).toBeDefined();
  });

  it("should define MaterializedRule with required fields", () => {
    const rule: MaterializedRule = {
      id: "no-eval",
      scope: "always",
      content: "Never use eval()",
      priority: 100,
    };
    expect(rule.id).toBeDefined();
    expect(rule.priority).toBe(100);
  });

  it("should define MaterializedSurface with name and content", () => {
    const surface: MaterializedSurface = {
      name: "instructions.md",
      content: "Main instructions",
    };
    expect(surface.name).toBe("instructions.md");
  });

  it("should define MaterializedSubagent with all fields", () => {
    const subagent: MaterializedSubagent = {
      name: "code-reviewer",
      description: "Reviews code",
      invocation: "delegate",
      instructions: "Review the code for quality",
      model: "claude-sonnet-4",
    };
    expect(subagent.name).toBeDefined();
    expect(subagent.model).toBe("claude-sonnet-4");
  });

  it("should define MaterializedWorkspaceSource", () => {
    const ws: MaterializedWorkspaceSource = {
      id: "backend-repo",
      mountPath: "/workspace/backend",
      resolved: true,
    };
    expect(ws.resolved).toBe(true);
  });

  it("should define MaterializationWarning with code and message", () => {
    const warning: MaterializationWarning = {
      code: "UNSUPPORTED_FEATURE",
      message: "Feature not supported by adapter",
      layer: "persona",
    };
    expect(warning.code).toBeDefined();
    expect(warning.layer).toBe("persona");
  });

  it("should define InstallPlan with actions and warnings", () => {
    const plan: InstallPlan = {
      actions: [
        { kind: "write", path: "CLAUDE.md", description: "Write main instructions" },
        { kind: "mkdir", path: ".claude/skills/", description: "Create skills directory" },
      ],
      warnings: [],
    };
    expect(plan.actions).toHaveLength(2);
  });

  it("should define InstallAction with all kind values", () => {
    const kinds: InstallAction["kind"][] = ["write", "mkdir", "setting", "api-call"];
    for (const kind of kinds) {
      const action: InstallAction = { kind, path: "test", description: "test" };
      expect(action.kind).toBe(kind);
    }
  });

  it("should define MaterializedInstructionNode with path and instructions", () => {
    const node: MaterializedInstructionNode = {
      path: "services/api",
      instructions: "API-specific instructions",
    };
    expect(node.path).toBe("services/api");
  });
});
