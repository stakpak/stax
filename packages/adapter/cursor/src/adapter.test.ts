import { describe, expect, it } from "vitest";
import cursor from "./adapter.ts";

describe("cursor adapter", () => {
  it("should return an AdapterConfig with type cursor", () => {
    const config = cursor();
    expect(config.type).toBe("cursor");
    expect(config.runtime).toBe("cursor");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should include AGENTS.md target", () => {
    const config = cursor();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
  });

  it("should include .cursor/rules/ target", () => {
    const config = cursor();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".cursor/rules/");
  });

  it("should include .cursor/mcp.json target", () => {
    const config = cursor();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".cursor/mcp.json");
  });

  it("should translate rules to MDC format", () => {
    const config = cursor();
    expect(config.features.rules).toBe("translated");
  });

  it("should set prompt as native", () => {
    const config = cursor();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as embedded", () => {
    const config = cursor();
    expect(config.features.persona).toBe("embedded");
  });

  it("should support native skills", () => {
    const config = cursor();
    expect(config.features.skills).toBe("native");
  });

  it("should translate MCP", () => {
    const config = cursor();
    expect(config.features.mcp).toBe("translated");
  });

  it("should set secrets as consumer-only", () => {
    const config = cursor();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should set model when provided", () => {
    const config = cursor({ model: "gpt-4o" });
    expect(config.model).toBe("gpt-4o");
  });

  it("should default to filesystem import mode", () => {
    const config = cursor();
    expect(config.importMode).toBe("filesystem");
  });

  it("should include .cursor/skills/ target", () => {
    const config = cursor();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".cursor/skills/");
  });

  it("should set toolPermissions as unsupported", () => {
    const config = cursor();
    expect(config.features.toolPermissions).toBe("unsupported");
  });

  it("should set modelConfig as unsupported", () => {
    const config = cursor();
    expect(config.features.modelConfig).toBe("unsupported");
  });

  it("should set surfaces as embedded", () => {
    const config = cursor();
    expect(config.features.surfaces).toBe("embedded");
  });

  it("should set exactMode to true in features", () => {
    const config = cursor();
    expect(config.features.exactMode).toBe(true);
  });

  it("should set subagents as unsupported", () => {
    const config = cursor();
    expect(config.features.subagents).toBe("unsupported");
  });

  it("should set instructionTree as unsupported", () => {
    const config = cursor();
    expect(config.features.instructionTree).toBe("unsupported");
  });
});
