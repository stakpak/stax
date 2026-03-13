import { describe, expect, it } from "vitest";
import windsurf from "./adapter.ts";

describe("windsurf adapter", () => {
  it("should return an AdapterConfig with type windsurf", () => {
    const config = windsurf();
    expect(config.type).toBe("windsurf");
    expect(config.runtime).toBe("windsurf");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should include AGENTS.md target", () => {
    const config = windsurf();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
  });

  it("should include .windsurf/rules/ target", () => {
    const config = windsurf();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".windsurf/rules/");
  });

  it("should include .windsurf/workflows/ for skills", () => {
    const config = windsurf();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".windsurf/workflows/");
  });

  it("should translate skills to workflows", () => {
    const config = windsurf();
    expect(config.features.skills).toBe("translated");
  });

  it("should set prompt as native", () => {
    const config = windsurf();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as embedded", () => {
    const config = windsurf();
    expect(config.features.persona).toBe("embedded");
  });

  it("should translate rules", () => {
    const config = windsurf();
    expect(config.features.rules).toBe("translated");
  });

  it("should translate MCP", () => {
    const config = windsurf();
    expect(config.features.mcp).toBe("translated");
  });

  it("should set secrets as consumer-only", () => {
    const config = windsurf();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should set toolPermissions as unsupported", () => {
    const config = windsurf();
    expect(config.features.toolPermissions).toBe("unsupported");
  });

  it("should set modelConfig as unsupported", () => {
    const config = windsurf();
    expect(config.features.modelConfig).toBe("unsupported");
  });

  it("should set model when provided", () => {
    const config = windsurf({ model: "gpt-4o" });
    expect(config.model).toBe("gpt-4o");
  });

  it("should default to filesystem import mode", () => {
    const config = windsurf();
    expect(config.importMode).toBe("filesystem");
  });

  it("should set surfaces as embedded", () => {
    const config = windsurf();
    expect(config.features.surfaces).toBe("embedded");
  });

  it("should set exactMode to true in features", () => {
    const config = windsurf();
    expect(config.features.exactMode).toBe(true);
  });

  it("should set subagents as unsupported", () => {
    const config = windsurf();
    expect(config.features.subagents).toBe("unsupported");
  });

  it("should set instructionTree as unsupported", () => {
    const config = windsurf();
    expect(config.features.instructionTree).toBe("unsupported");
  });
});
