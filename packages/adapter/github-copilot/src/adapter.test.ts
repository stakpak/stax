import { describe, expect, it } from "vitest";
import githubCopilot from "./adapter.ts";

describe("githubCopilot adapter", () => {
  it("should return an AdapterConfig with type github-copilot", () => {
    const config = githubCopilot();
    expect(config.type).toBe("github-copilot");
    expect(config.runtime).toBe("github-copilot");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should include .github/copilot-instructions.md target", () => {
    const config = githubCopilot();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".github/copilot-instructions.md");
  });

  it("should include .github/instructions/ for path-scoped rules", () => {
    const config = githubCopilot();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".github/instructions/");
  });

  it("should include .vscode/mcp.json target", () => {
    const config = githubCopilot();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".vscode/mcp.json");
  });

  it("should translate rules to .instructions.md format", () => {
    const config = githubCopilot();
    expect(config.features.rules).toBe("translated");
  });

  it("should set prompt as native", () => {
    const config = githubCopilot();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as embedded", () => {
    const config = githubCopilot();
    expect(config.features.persona).toBe("embedded");
  });

  it("should support native skills", () => {
    const config = githubCopilot();
    expect(config.features.skills).toBe("native");
  });

  it("should translate MCP", () => {
    const config = githubCopilot();
    expect(config.features.mcp).toBe("translated");
  });

  it("should set secrets as consumer-only", () => {
    const config = githubCopilot();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should set model when provided", () => {
    const config = githubCopilot({ model: "gpt-4o" });
    expect(config.model).toBe("gpt-4o");
  });

  it("should include .github/skills/ target", () => {
    const config = githubCopilot();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".github/skills/");
  });

  it("should set modelConfig as native", () => {
    const config = githubCopilot();
    expect(config.features.modelConfig).toBe("native");
  });

  it("should set exactMode to true in features", () => {
    const config = githubCopilot();
    expect(config.features.exactMode).toBe(true);
  });

  it("should set toolPermissions as unsupported", () => {
    const config = githubCopilot();
    expect(config.features.toolPermissions).toBe("unsupported");
  });

  it("should set surfaces as embedded", () => {
    const config = githubCopilot();
    expect(config.features.surfaces).toBe("embedded");
  });

  it("should default to filesystem import mode", () => {
    const config = githubCopilot();
    expect(config.importMode).toBe("filesystem");
  });

  it("should include AGENTS.md target", () => {
    const config = githubCopilot();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
  });

  it("should set subagents as native", () => {
    const config = githubCopilot();
    expect(config.features.subagents).toBe("native");
  });

  it("should set instructionTree as native", () => {
    const config = githubCopilot();
    expect(config.features.instructionTree).toBe("native");
  });
});
