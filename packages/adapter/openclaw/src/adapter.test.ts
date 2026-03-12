import { describe, expect, it } from "vitest";
import openclaw from "./adapter.ts";

describe("openclaw adapter", () => {
  it("should return an AdapterConfig with type openclaw", () => {
    const config = openclaw();
    expect(config.type).toBe("openclaw");
    expect(config.runtime).toBe("openclaw");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should include all surface targets", () => {
    const config = openclaw();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
    expect(paths).toContain("SOUL.md");
    expect(paths).toContain("TOOLS.md");
    expect(paths).toContain("IDENTITY.md");
    expect(paths).toContain("USER.md");
    expect(paths).toContain("HEARTBEAT.md");
    expect(paths).toContain("BOOTSTRAP.md");
  });

  it("should include skills and memory targets", () => {
    const config = openclaw();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("skills/");
    expect(paths).toContain("memory/");
  });

  it("should support native surfaces", () => {
    const config = openclaw();
    expect(config.features.surfaces).toBe("native");
  });

  it("should default to filesystem import mode", () => {
    const config = openclaw();
    expect(config.importMode).toBe("filesystem");
  });

  it("should set prompt as native", () => {
    const config = openclaw();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as native (through surfaces)", () => {
    const config = openclaw();
    // OpenClaw has dedicated SOUL.md, so persona maps through surfaces
    expect(config.features.persona === "native" || config.features.persona === "embedded").toBe(
      true,
    );
  });

  it("should support native skills", () => {
    const config = openclaw();
    expect(config.features.skills).toBe("native");
  });

  it("should set secrets as consumer-only", () => {
    const config = openclaw();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should set fidelity to byte-exact by default", () => {
    const config = openclaw();
    // OpenClaw adapter defaults exact: true
    expect(config.fidelity).toBe("byte-exact");
  });

  it("should set model when provided", () => {
    const config = openclaw({ model: "claude-opus-4-1" });
    expect(config.model).toBe("claude-opus-4-1");
  });

  it("should accept workspace option", () => {
    const config = openclaw({ workspace: "/path/to/workspace" });
    expect(config.config.workspace).toBe("/path/to/workspace");
  });

  it("should not include ~/.openclaw/openclaw.json in targets", () => {
    const config = openclaw();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).not.toContain("~/.openclaw/openclaw.json");
  });

  it("should not include credentials in targets", () => {
    const config = openclaw();
    const paths = config.targets?.map((t) => t.path) ?? [];
    const hasCredentials = paths.some((p) => p.includes("credentials"));
    expect(hasCredentials).toBe(false);
  });
});
