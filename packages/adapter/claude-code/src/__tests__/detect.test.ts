import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { detect } from "../detect.ts";

describe("claude-code detect", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "stax-detect-cc-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("should return found: false when no config exists", () => {
    // Use a fake home dir to avoid detecting real user config
    const fakeHome = mkdtempSync(join(tmpdir(), "stax-fakehome-"));
    const result = detect(tmp, { homeDir: fakeHome });
    expect(result.found).toBe(false);
    expect(result.files).toHaveLength(0);
    rmSync(fakeHome, { recursive: true, force: true });
  });

  it("should detect CLAUDE.md at project root", () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# Agent");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: "CLAUDE.md", scope: "project", kind: "prompt" }),
    );
  });

  it("should detect .mcp.json at project root", () => {
    writeFileSync(join(tmp, ".mcp.json"), "{}");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".mcp.json", scope: "project", kind: "mcp" }),
    );
  });

  it("should detect .claude/settings.json", () => {
    mkdirSync(join(tmp, ".claude"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "settings.json"), "{}");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({
        targetPath: ".claude/settings.json",
        scope: "project",
        kind: "config",
      }),
    );
  });

  it("should detect .claude/skills/ directory", () => {
    mkdirSync(join(tmp, ".claude", "skills"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "skills", "test.md"), "skill");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".claude/skills/", scope: "project", kind: "skills" }),
    );
  });

  it("should detect multiple files at once", () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# Agent");
    writeFileSync(join(tmp, ".mcp.json"), "{}");
    mkdirSync(join(tmp, ".claude"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "settings.json"), "{}");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files.length).toBeGreaterThanOrEqual(3);
  });

  it("should detect global ~/.claude/CLAUDE.md", () => {
    // We pass a custom home dir to avoid touching real user config
    const result = detect(tmp, { homeDir: tmp });
    // Without creating the file, should not find it
    expect(result.files.filter((f) => f.scope === "user")).toHaveLength(0);

    // Create the global file
    mkdirSync(join(tmp, ".claude"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "CLAUDE.md"), "# Global");

    // Now the same directory acts as both project and home
    // But we want to test the global detection specifically
    const home = mkdtempSync(join(tmpdir(), "stax-home-"));
    mkdirSync(join(home, ".claude"), { recursive: true });
    writeFileSync(join(home, ".claude", "CLAUDE.md"), "# Global");

    const result2 = detect(tmp, { homeDir: home });
    expect(result2.files).toContainEqual(
      expect.objectContaining({ targetPath: "~/.claude/CLAUDE.md", scope: "user", kind: "prompt" }),
    );

    rmSync(home, { recursive: true, force: true });
  });

  it("should detect .claude/rules/ directory", () => {
    mkdirSync(join(tmp, ".claude", "rules"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "rules", "style.md"), "# Style");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".claude/rules/", scope: "project", kind: "rules" }),
    );
  });

  it("should detect .claude/commands/ directory", () => {
    mkdirSync(join(tmp, ".claude", "commands"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "commands", "deploy.md"), "# Deploy");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({
        targetPath: ".claude/commands/",
        scope: "project",
        kind: "skills",
      }),
    );
  });

  it("should detect .claude/settings.local.json", () => {
    mkdirSync(join(tmp, ".claude"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "settings.local.json"), "{}");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({
        targetPath: ".claude/settings.local.json",
        scope: "project",
        kind: "config",
      }),
    );
  });

  it("should detect global ~/.claude/rules/ directory", () => {
    const home = mkdtempSync(join(tmpdir(), "stax-home-"));
    mkdirSync(join(home, ".claude", "rules"), { recursive: true });
    writeFileSync(join(home, ".claude", "rules", "prefs.md"), "# Preferences");
    const result = detect(tmp, { homeDir: home });
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: "~/.claude/rules/", scope: "user", kind: "rules" }),
    );
    rmSync(home, { recursive: true, force: true });
  });

  it("should detect global ~/.claude.json as config (not mcp)", () => {
    const home = mkdtempSync(join(tmpdir(), "stax-home-"));
    writeFileSync(join(home, ".claude.json"), JSON.stringify({ oauthTokens: {}, mcpServers: {} }));
    const result = detect(tmp, { homeDir: home });
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: "~/.claude.json", scope: "user", kind: "config" }),
    );
    // Must NOT be kind: "mcp"
    const claudeJson = result.files.find((f) => f.targetPath === "~/.claude.json");
    expect(claudeJson?.kind).toBe("config");
    rmSync(home, { recursive: true, force: true });
  });

  it("should set adapter to claude-code", () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# Agent");
    const result = detect(tmp);
    expect(result.adapter).toBe("claude-code");
  });
});
