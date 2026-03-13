import { describe, expect, it } from "vitest";
import opencode from "./adapter.ts";

describe("opencode adapter", () => {
  it("should return an AdapterConfig with type opencode", () => {
    const config = opencode();
    expect(config.type).toBe("opencode");
    expect(config.runtime).toBe("opencode");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should include AGENTS.md target", () => {
    const config = opencode();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
  });

  it("should include opencode.jsonc target", () => {
    const config = opencode();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("opencode.jsonc");
  });

  it("should include .opencode/skill/ target", () => {
    const config = opencode();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".opencode/skill/");
  });

  it("should include .opencode/command/ target", () => {
    const config = opencode();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".opencode/command/");
  });

  it("should set model with provider prefix", () => {
    const config = opencode({ model: "anthropic/claude-sonnet-4-20250514" });
    expect(config.model).toBe("anthropic/claude-sonnet-4-20250514");
  });

  it("should set prompt as native", () => {
    const config = opencode();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as embedded", () => {
    const config = opencode();
    expect(config.features.persona).toBe("embedded");
  });

  it("should embed rules", () => {
    const config = opencode();
    expect(config.features.rules).toBe("embedded");
  });

  it("should support native skills", () => {
    const config = opencode();
    expect(config.features.skills).toBe("native");
  });

  it("should translate MCP", () => {
    const config = opencode();
    expect(config.features.mcp).toBe("translated");
  });

  it("should set secrets as consumer-only", () => {
    const config = opencode();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should translate toolPermissions", () => {
    const config = opencode();
    expect(config.features.toolPermissions).toBe("translated");
  });

  it("should set modelConfig as native", () => {
    const config = opencode();
    expect(config.features.modelConfig).toBe("native");
  });

  it("should default to filesystem import mode", () => {
    const config = opencode();
    expect(config.importMode).toBe("filesystem");
  });

  it("should set surfaces as embedded", () => {
    const config = opencode();
    expect(config.features.surfaces).toBe("embedded");
  });

  it("should set exactMode to true in features", () => {
    const config = opencode();
    expect(config.features.exactMode).toBe(true);
  });

  it("should accept agent config with build model", () => {
    const config = opencode({
      agent: { build: { model: "anthropic/claude-sonnet-4-20250514" } },
    });
    expect(config.config.agent).toBeDefined();
  });

  it("should set subagents as native", () => {
    const config = opencode();
    expect(config.features.subagents).toBe("native");
  });

  it("should set instructionTree as translated", () => {
    const config = opencode();
    expect(config.features.instructionTree).toBe("translated");
  });
});
