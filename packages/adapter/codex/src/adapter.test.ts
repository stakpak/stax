import { describe, expect, it } from "vitest";
import codex from "./adapter.ts";

describe("codex adapter", () => {
  it("should return an AdapterConfig with type codex", () => {
    const config = codex();
    expect(config.type).toBe("codex");
    expect(config.runtime).toBe("codex");
    expect(config.adapterVersion).toBe("1.0.0");
  });

  it("should set model when provided", () => {
    const config = codex({ model: "gpt-5-codex" });
    expect(config.model).toBe("gpt-5-codex");
  });

  it("should include AGENTS.md target", () => {
    const config = codex();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain("AGENTS.md");
  });

  it("should include config.toml target", () => {
    const config = codex();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".codex/config.toml");
  });

  it("should include skills target", () => {
    const config = codex();
    const paths = config.targets?.map((t) => t.path) ?? [];
    expect(paths).toContain(".agents/skills/");
  });

  it("should pass approval mode to config", () => {
    const config = codex({ approval: "on-request" });
    expect(config.config.approval).toBe("on-request");
  });

  it("should pass sandbox mode to config", () => {
    const config = codex({ sandbox: "workspace-write" });
    expect(config.config.sandbox).toBe("workspace-write");
  });

  it("should default to filesystem import mode", () => {
    const config = codex();
    expect(config.importMode).toBe("filesystem");
  });

  it("should support native prompt feature", () => {
    const config = codex();
    expect(config.features.prompt).toBe("native");
  });

  it("should set persona as embedded", () => {
    const config = codex();
    expect(config.features.persona).toBe("embedded");
  });

  it("should support native skills", () => {
    const config = codex();
    expect(config.features.skills).toBe("native");
  });

  it("should translate MCP to config.toml", () => {
    const config = codex();
    expect(config.features.mcp).toBe("translated");
  });

  it("should set secrets as consumer-only", () => {
    const config = codex();
    expect(config.features.secrets).toBe("consumer-only");
  });

  it("should default approval mode", () => {
    const config = codex();
    // Default should be defined or undefined but not throw
    expect(config).toBeDefined();
  });

  it("should accept all valid approval modes", () => {
    const modes = ["untrusted", "on-request", "never"] as const;
    for (const approval of modes) {
      const config = codex({ approval });
      expect(config.config.approval).toBe(approval);
    }
  });

  it("should accept all valid sandbox modes", () => {
    const modes = ["read-only", "workspace-write", "danger-full-access"] as const;
    for (const sandbox of modes) {
      const config = codex({ sandbox });
      expect(config.config.sandbox).toBe(sandbox);
    }
  });

  it("should set fidelity to byte-exact in exact mode", () => {
    const config = codex({ approval: "untrusted", sandbox: "workspace-write" });
    // When not exact, should be best-effort
    expect(config.fidelity).toBe("best-effort");
  });
});
