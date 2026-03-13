import { describe, expect, it } from "vitest";
import claudeCode from "./adapter.ts";

describe("claudeCode adapter", () => {
  it("should return an AdapterConfig with type claude-code", () => {
    const config = claudeCode();
    expect(config.type).toBe("claude-code");
    expect(config.runtime).toBe("claude-code");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should set model when provided", () => {
    const config = claudeCode({ model: "claude-opus-4-1" });
    expect(config.model).toBe("claude-opus-4-1");
  });

  it("should default to filesystem import mode", () => {
    const config = claudeCode();
    expect(config.importMode).toBe("filesystem");
  });

  it("should support native features", () => {
    const config = claudeCode();
    expect(config.features.prompt).toBe("native");
    expect(config.features.rules).toBe("native");
    expect(config.features.skills).toBe("native");
    expect(config.features.mcp).toBe("native");
  });

  it("should set persona feature as embedded", () => {
    const config = claudeCode();
    expect(config.features.persona).toBe("embedded");
  });

  it("should include materialization targets for project scope", () => {
    const config = claudeCode({ scope: "project" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("CLAUDE.md");
    expect(paths).toContain(".claude/skills/");
    expect(paths).toContain(".mcp.json");
  });

  it("should include user scope targets when scope is user", () => {
    const config = claudeCode({ scope: "user" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("~/.claude/CLAUDE.md");
  });

  it("should pass through modelParams", () => {
    const config = claudeCode({
      model: "claude-sonnet-4",
      modelParams: { temperature: 0.3 },
    });
    expect(config.modelParams).toEqual({ temperature: 0.3 });
  });

  it("should respect exact mode", () => {
    const config = claudeCode({ exact: true });
    expect(config.fidelity).toBe("byte-exact");
  });

  it("should respect instructionsFile option", () => {
    const config = claudeCode({ instructionsFile: ".claude/CLAUDE.md" });
    const instructionTarget = config.targets?.find((t) => t.path.includes("CLAUDE.md"));
    expect(instructionTarget?.path).toBe(".claude/CLAUDE.md");
  });

  it("should default writeSkills to true", () => {
    const config = claudeCode();
    expect(config.config.writeSkills).not.toBe(false);
  });

  it("should default writeMcp to true", () => {
    const config = claudeCode();
    expect(config.config.writeMcp).not.toBe(false);
  });

  it("should default writeSettings to true", () => {
    const config = claudeCode();
    expect(config.config.writeSettings).not.toBe(false);
  });

  it("should default to project scope", () => {
    const config = claudeCode();
    const targets = config.targets ?? [];
    const hasProjectTarget = targets.some(
      (t) => t.path === "CLAUDE.md" || t.path === ".claude/CLAUDE.md",
    );
    expect(hasProjectTarget).toBe(true);
  });

  it("should not generate settings.local.json by default", () => {
    const config = claudeCode();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).not.toContain(".claude/settings.local.json");
  });

  it("should include .claude/settings.json target", () => {
    const config = claudeCode({ scope: "project" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".claude/settings.json");
  });

  it("should set features.surfaces to embedded", () => {
    const config = claudeCode();
    expect(config.features.surfaces).toBe("embedded");
  });

  it("should include exactMode in features (spec 12)", () => {
    const config = claudeCode();
    expect(config.features.exactMode).toBe(true);
  });

  it("should include subagents feature in feature map (spec 12)", () => {
    const config = claudeCode();
    expect(config.features.subagents).toBe("native");
  });

  it("should include instructionTree feature in feature map (spec 12)", () => {
    const config = claudeCode();
    expect(config.features.instructionTree).toBe("native");
  });

  it("should set features.secrets to consumer-only", () => {
    const config = claudeCode();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should include subagents target .claude/agents/", () => {
    const config = claudeCode({ scope: "project" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths.some((p) => p.includes("agents/"))).toBe(true);
  });

  it("should set default fidelity to best-effort when not exact", () => {
    const config = claudeCode();
    expect(config.fidelity).toBe("best-effort");
  });

  it("should accept permissions with allowedTools and denyRules", () => {
    const config = claudeCode({
      permissions: {
        allowedTools: ["Read", "Edit", "Bash"],
        denyRules: ["Bash(rm -rf *)"],
      },
    });
    expect(config.config.permissions).toBeDefined();
  });

  it("should accept settings passthrough", () => {
    const config = claudeCode({
      settings: { customKey: "customValue" },
    });
    expect(config.config.settings).toBeDefined();
  });

  it("should include user scope MCP target ~/.claude.json", () => {
    const config = claudeCode({ scope: "user" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("~/.claude.json");
  });

  it("should include user scope skills target", () => {
    const config = claudeCode({ scope: "user" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("~/.claude/skills/");
  });

  it("should include user scope settings target", () => {
    const config = claudeCode({ scope: "user" });
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("~/.claude/settings.json");
  });

  it("should set toolPermissions as native", () => {
    const config = claudeCode();
    expect(config.features.toolPermissions).toBe("native");
  });

  it("should set modelConfig as native", () => {
    const config = claudeCode();
    expect(config.features.modelConfig).toBe("native");
  });
});
