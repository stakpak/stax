import { mkdtempSync, existsSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { run } from "./helpers.ts";

describe("init", () => {
  let tmp: string;
  let fakeHome: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "stax-init-"));
    // Isolate from real user config by using a fake HOME
    fakeHome = mkdtempSync(join(tmpdir(), "stax-fakehome-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
    rmSync(fakeHome, { recursive: true, force: true });
  });

  /** Helper: run CLI with isolated HOME */
  function cli(args: string[], opts?: { cwd?: string }) {
    return run(args, { cwd: opts?.cwd ?? tmp, env: { HOME: fakeHome } });
  }

  // ── Basic command acceptance ──

  it("should accept init command", async () => {
    const { exitCode } = await cli(["init", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
  });

  it("should accept --agent flag", async () => {
    const { exitCode } = await cli(["init", "--agent", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
  });

  it("should accept --package flag", async () => {
    const { exitCode } = await cli(["init", "--package", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
  });

  it("should reject --agent and --package together", async () => {
    const { exitCode } = await cli(["init", "--agent", "--package", "--non-interactive"], {
      cwd: tmp,
    });
    expect(exitCode).not.toBe(0);
  });

  it("should reject unknown template names", async () => {
    const { exitCode } = await cli(
      ["init", "--template", "nonexistent-template-xyz", "--non-interactive"],
      { cwd: tmp },
    );
    expect(exitCode).not.toBe(0);
  });

  // ── .stax/[name]/ directory structure ──

  it("should scaffold agent.ts inside .stax/[name]/", async () => {
    const { exitCode } = await cli(["init", "--agent", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
    const dirs = readdirStax(tmp);
    expect(dirs.length).toBeGreaterThan(0);
    expect(existsSync(join(tmp, ".stax", dirs[0]!, "agent.ts"))).toBe(true);
  });

  it("should scaffold package.ts inside .stax/[name]/", async () => {
    const { exitCode } = await cli(["init", "--package", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
    const dirs = readdirStax(tmp);
    expect(existsSync(join(tmp, ".stax", dirs[0]!, "package.ts"))).toBe(true);
  });

  it("should create SYSTEM_PROMPT.md inside .stax/[name]/", async () => {
    await cli(["init", "--agent", "--non-interactive"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    expect(existsSync(join(tmp, ".stax", dirs[0]!, "SYSTEM_PROMPT.md"))).toBe(true);
  });

  it("should create rules/ and skills/ inside .stax/[name]/", async () => {
    await cli(["init", "--non-interactive"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const agentDir = join(tmp, ".stax", dirs[0]!);
    expect(existsSync(join(agentDir, "rules"))).toBe(true);
    expect(existsSync(join(agentDir, "skills"))).toBe(true);
  });

  it("should create .staxignore at project root only", async () => {
    await cli(["init", "--non-interactive"], { cwd: tmp });
    expect(existsSync(join(tmp, ".staxignore"))).toBe(true);
    const dirs = readdirStax(tmp);
    expect(existsSync(join(tmp, ".stax", dirs[0]!, ".staxignore"))).toBe(false);
  });

  it("should NOT create agent.ts at project root", async () => {
    await cli(["init", "--agent", "--non-interactive"], { cwd: tmp });
    expect(existsSync(join(tmp, "agent.ts"))).toBe(false);
  });

  it("should support multiple agents in same project", async () => {
    const { exitCode: c1 } = await cli(
      ["init", "--agent", "--name", "agent-a", "--non-interactive"],
      { cwd: tmp },
    );
    expect(c1).toBe(0);
    const { exitCode: c2 } = await cli(
      ["init", "--agent", "--name", "agent-b", "--non-interactive"],
      { cwd: tmp },
    );
    expect(c2).toBe(0);
    expect(existsSync(join(tmp, ".stax", "agent-a", "agent.ts"))).toBe(true);
    expect(existsSync(join(tmp, ".stax", "agent-b", "agent.ts"))).toBe(true);
  });

  it("should not overwrite existing agent with same name", async () => {
    await cli(["init", "--agent", "--name", "my-agent", "--non-interactive"], { cwd: tmp });
    const { exitCode } = await cli(["init", "--agent", "--name", "my-agent", "--non-interactive"], {
      cwd: tmp,
    });
    expect(exitCode).toBe(1);
  });

  it("should use --name flag for directory name", async () => {
    await cli(["init", "--agent", "--name", "cool-bot", "--non-interactive"], { cwd: tmp });
    expect(existsSync(join(tmp, ".stax", "cool-bot", "agent.ts"))).toBe(true);
  });

  it("should generate agent.ts with relative paths", async () => {
    await cli(["init", "--agent", "--name", "my-bot", "--non-interactive"], { cwd: tmp });
    const content = readFileSync(join(tmp, ".stax", "my-bot", "agent.ts"), "utf-8");
    expect(content).toContain("./SYSTEM_PROMPT.md");
    expect(content).toContain("./rules/");
    expect(content).toContain("./skills/");
  });

  it("should use specified adapter in generated agent.ts", async () => {
    await cli(["init", "--non-interactive", "--adapter", "cursor", "--name", "c"], { cwd: tmp });
    const content = readFileSync(join(tmp, ".stax", "c", "agent.ts"), "utf-8");
    expect(content).toContain("cursor");
    expect(content).toContain("@stax/cursor");
  });

  // ── Detection: only local project files are imported ──

  it("should detect local CLAUDE.md", async () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# My Agent\n\nYou help with code.");
    const { exitCode, stdout } = await cli(["init", "--non-interactive"], { cwd: tmp });
    expect(exitCode).toBe(0);
    expect(stdout.toLowerCase()).toContain("detected");
  });

  it("should import local CLAUDE.md content as SYSTEM_PROMPT.md", async () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# My Bot\n\nYou help with code reviews.");
    await cli(["init", "--non-interactive"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const imported = readFileSync(join(tmp, ".stax", dirs[0]!, "SYSTEM_PROMPT.md"), "utf-8");
    expect(imported).toContain("code reviews");
  });

  it("should import local .mcp.json into mcp.json", async () => {
    const mcp = JSON.stringify({ mcpServers: { gh: { command: "gh" } } });
    writeFileSync(join(tmp, ".mcp.json"), mcp);
    await cli(["init", "--non-interactive"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const imported = readFileSync(join(tmp, ".stax", dirs[0]!, "mcp.json"), "utf-8");
    expect(imported).toContain("gh");
  });

  it("should import local .claude/skills/ into skills/", async () => {
    mkdirSync(join(tmp, ".claude", "skills"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "skills", "deploy.md"), "# Deploy\nDeploy to prod.");
    writeFileSync(join(tmp, ".claude", "skills", "review.md"), "# Review\nReview PRs.");
    await cli(["init", "--non-interactive"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const skillsDir = join(tmp, ".stax", dirs[0]!, "skills");
    expect(existsSync(join(skillsDir, "deploy.md"))).toBe(true);
    expect(existsSync(join(skillsDir, "review.md"))).toBe(true);
    expect(readFileSync(join(skillsDir, "deploy.md"), "utf-8")).toContain("Deploy to prod");
  });

  it("should import local .cursorrules into rules/", async () => {
    writeFileSync(join(tmp, ".cursorrules"), "Always use TypeScript.");
    await cli(["init", "--non-interactive", "--adapter", "cursor"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const rulesDir = join(tmp, ".stax", dirs[0]!, "rules");
    const files = fsReaddirSync(rulesDir).filter((f: string) => f !== ".gitkeep");
    expect(files.length).toBeGreaterThan(0);
  });

  it("should import local .cursor/rules/ directory into rules/", async () => {
    mkdirSync(join(tmp, ".cursor", "rules"), { recursive: true });
    writeFileSync(join(tmp, ".cursor", "rules", "style.mdc"), "Use functional style.");
    writeFileSync(join(tmp, ".cursor", "rules", "types.mdc"), "Use strict types.");
    await cli(["init", "--non-interactive", "--adapter", "cursor"], { cwd: tmp });
    const dirs = readdirStax(tmp);
    const rulesDir = join(tmp, ".stax", dirs[0]!, "rules");
    expect(existsSync(join(rulesDir, "style.mdc"))).toBe(true);
    expect(existsSync(join(rulesDir, "types.mdc"))).toBe(true);
  });

  // ── Global config: extract safe fields only ──

  it("should import global prompt when no local prompt exists", async () => {
    mkdirSync(join(fakeHome, ".claude"), { recursive: true });
    writeFileSync(
      join(fakeHome, ".claude", "CLAUDE.md"),
      "# Global Bot\n\nYou handle deployments.",
    );
    const { exitCode } = await cli(["init", "--non-interactive"]);
    expect(exitCode).toBe(0);
    const dirs = readdirStax(tmp);
    const prompt = readFileSync(join(tmp, ".stax", dirs[0]!, "SYSTEM_PROMPT.md"), "utf-8");
    expect(prompt).toContain("deployments");
  });

  it("should prefer local prompt over global prompt", async () => {
    writeFileSync(join(tmp, "CLAUDE.md"), "# Local\n\nLocal instructions.");
    mkdirSync(join(fakeHome, ".claude"), { recursive: true });
    writeFileSync(join(fakeHome, ".claude", "CLAUDE.md"), "# Global\n\nGlobal instructions.");
    await cli(["init", "--non-interactive"]);
    const dirs = readdirStax(tmp);
    const prompt = readFileSync(join(tmp, ".stax", dirs[0]!, "SYSTEM_PROMPT.md"), "utf-8");
    expect(prompt).toContain("Local instructions");
    expect(prompt).not.toContain("Global instructions");
  });

  it("should extract only mcpServers from global ~/.claude.json", async () => {
    const globalConfig = JSON.stringify({
      oauthTokens: { "secret-token": "abc123" },
      theme: "dark",
      mcpServers: { "my-server": { command: "npx", args: ["-y", "my-mcp"] } },
      perProjectState: { "/some/path": { trusted: true } },
    });
    writeFileSync(join(fakeHome, ".claude.json"), globalConfig);
    await cli(["init", "--non-interactive"]);
    const dirs = readdirStax(tmp);
    const mcpPath = join(tmp, ".stax", dirs[0]!, "mcp.json");
    expect(existsSync(mcpPath)).toBe(true);
    const mcp = readFileSync(mcpPath, "utf-8");
    expect(mcp).toContain("my-server");
    // Must NOT contain sensitive data
    expect(mcp).not.toContain("oauthTokens");
    expect(mcp).not.toContain("secret-token");
    expect(mcp).not.toContain("theme");
    expect(mcp).not.toContain("perProjectState");
  });

  it("should not let global config overwrite local .mcp.json", async () => {
    // Local MCP
    writeFileSync(
      join(tmp, ".mcp.json"),
      JSON.stringify({ mcpServers: { local: { command: "local-cmd" } } }),
    );
    // Global config with mcpServers
    writeFileSync(
      join(fakeHome, ".claude.json"),
      JSON.stringify({ mcpServers: { global: { command: "global-cmd" } } }),
    );
    await cli(["init", "--non-interactive"]);
    const dirs = readdirStax(tmp);
    const mcp = readFileSync(join(tmp, ".stax", dirs[0]!, "mcp.json"), "utf-8");
    expect(mcp).toContain("local-cmd");
    expect(mcp).not.toContain("global-cmd");
  });

  it("should import global skills when no local skills exist", async () => {
    mkdirSync(join(fakeHome, ".claude", "skills"), { recursive: true });
    writeFileSync(join(fakeHome, ".claude", "skills", "global-skill.md"), "# Global Skill");
    await cli(["init", "--non-interactive"]);
    const dirs = readdirStax(tmp);
    const skillsDir = join(tmp, ".stax", dirs[0]!, "skills");
    expect(existsSync(join(skillsDir, "global-skill.md"))).toBe(true);
  });

  it("should import global rules alongside local rules", async () => {
    // Local rules
    mkdirSync(join(tmp, ".claude", "rules"), { recursive: true });
    writeFileSync(join(tmp, ".claude", "rules", "local.md"), "# Local rule");
    // Global rules
    mkdirSync(join(fakeHome, ".claude", "rules"), { recursive: true });
    writeFileSync(join(fakeHome, ".claude", "rules", "global.md"), "# Global rule");
    await cli(["init", "--non-interactive"]);
    const dirs = readdirStax(tmp);
    const rulesDir = join(tmp, ".stax", dirs[0]!, "rules");
    expect(existsSync(join(rulesDir, "local.md"))).toBe(true);
    expect(existsSync(join(rulesDir, "global.md"))).toBe(true);
  });

  it("should use default prompt when no config exists", async () => {
    const { exitCode } = await cli(["init", "--non-interactive"]);
    expect(exitCode).toBe(0);
    const dirs = readdirStax(tmp);
    const prompt = readFileSync(join(tmp, ".stax", dirs[0]!, "SYSTEM_PROMPT.md"), "utf-8");
    expect(prompt).toContain("You are a helpful assistant");
  });

  // ── Other adapters ──

  it("should detect .github/copilot-instructions.md for github-copilot", async () => {
    mkdirSync(join(tmp, ".github"), { recursive: true });
    writeFileSync(join(tmp, ".github", "copilot-instructions.md"), "You are a coder.");
    const { stdout } = await cli(["init", "--non-interactive", "--adapter", "github-copilot"], {
      cwd: tmp,
    });
    expect(stdout.toLowerCase()).toContain("detected");
  });

  it("should detect AGENTS.md for codex", async () => {
    writeFileSync(join(tmp, "AGENTS.md"), "# Agent\n\nBe helpful.");
    const { stdout } = await cli(["init", "--non-interactive", "--adapter", "codex"], { cwd: tmp });
    expect(stdout.toLowerCase()).toContain("detected");
  });

  it("should detect .windsurf/rules/ for windsurf", async () => {
    mkdirSync(join(tmp, ".windsurf", "rules"), { recursive: true });
    writeFileSync(join(tmp, ".windsurf", "rules", "code.md"), "Use strict types.");
    const { stdout } = await cli(["init", "--non-interactive", "--adapter", "windsurf"], {
      cwd: tmp,
    });
    expect(stdout.toLowerCase()).toContain("detected");
  });

  it("should detect .opencode.json for opencode", async () => {
    writeFileSync(join(tmp, ".opencode.json"), "{}");
    const { stdout } = await cli(["init", "--non-interactive", "--adapter", "opencode"], {
      cwd: tmp,
    });
    expect(stdout.toLowerCase()).toContain("detected");
  });
});

function readdirStax(root: string): string[] {
  const fs = require("node:fs");
  const staxDir = join(root, ".stax");
  if (!existsSync(staxDir)) return [];
  return (fs.readdirSync(staxDir) as string[]).filter((name: string) => {
    if (name === "artifacts" || name === "cache") return false;
    return fs.statSync(join(staxDir, name)).isDirectory();
  });
}

function fsReaddirSync(dir: string): string[] {
  return require("node:fs").readdirSync(dir) as string[];
}
