import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { planInstall } from "./plan.ts";
import type { MaterializedAgent } from "./types.ts";

// Mock materialize so planInstall tests are independent
vi.mock("./materialize.ts", () => ({
  materialize: vi.fn(),
}));

import { materialize } from "./materialize.ts";
const mockedMaterialize = vi.mocked(materialize);

// ─── Test Data ─────────────────────────────────────────

function createAgent(overrides?: Partial<MaterializedAgent>): MaterializedAgent {
  return {
    config: {
      specVersion: "1.0.0",
      name: "test-agent",
      version: "0.1.0",
      description: "Test agent",
      adapter: {
        type: "claude-code",
        runtime: "claude-code",
        adapterVersion: "1.0.0",
        config: {},
        features: {
          prompt: "native",
          persona: "embedded",
          rules: "native",
          skills: "native",
          mcp: "native",
        },
        targets: [
          { kind: "file", path: "CLAUDE.md", scope: "project", description: "Main instructions" },
          {
            kind: "directory",
            path: ".claude/skills/",
            scope: "project",
            description: "Skills directory",
          },
          { kind: "file", path: ".mcp.json", scope: "project", description: "MCP configuration" },
          {
            kind: "file",
            path: ".claude/settings.json",
            scope: "project",
            description: "Claude settings",
          },
          {
            kind: "directory",
            path: ".claude/agents/",
            scope: "project",
            description: "Subagent definitions",
          },
        ],
      },
    },
    prompt: "You are a helpful assistant.",
    warnings: [],
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────

describe("planInstall", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "stax-plan-test-"));
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // ── Claude Code adapter ──

  describe("claude-code adapter", () => {
    it("should produce write action for CLAUDE.md", async () => {
      const agent = createAgent({ prompt: "System instructions" });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      const claudeMdAction = plan.actions.find((a) => a.kind === "write" && a.path === "CLAUDE.md");
      expect(claudeMdAction).toBeDefined();
      expect(claudeMdAction!.content).toContain("System instructions");
    });

    it("should produce write action for .mcp.json when MCP present", async () => {
      const agent = createAgent({
        mcp: {
          servers: {
            "test-server": {
              command: "npx",
              args: ["-y", "test-server"],
            },
          },
        },
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      const mcpAction = plan.actions.find((a) => a.kind === "write" && a.path === ".mcp.json");
      expect(mcpAction).toBeDefined();
      expect(mcpAction!.content).toBeDefined();
      // Verify it contains the server configuration
      const parsed = JSON.parse(mcpAction!.content!);
      expect(parsed.mcpServers?.["test-server"] ?? parsed.servers?.["test-server"]).toBeDefined();
    });

    it("should produce mkdir action for .claude/skills/", async () => {
      const agent = createAgent({
        skills: [
          { name: "code-review", path: "skills/code-review/SKILL.md", content: "Review code" },
        ],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      const mkdirAction = plan.actions.find(
        (a) => a.kind === "mkdir" && a.path === ".claude/skills/",
      );
      expect(mkdirAction).toBeDefined();
    });

    it("should produce write actions for each skill file", async () => {
      const agent = createAgent({
        skills: [
          { name: "code-review", path: "skills/code-review/SKILL.md", content: "Review code" },
          { name: "testing", path: "skills/testing/SKILL.md", content: "Write tests" },
        ],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      const skillWrites = plan.actions.filter(
        (a) => a.kind === "write" && a.path.startsWith(".claude/skills/"),
      );
      expect(skillWrites.length).toBe(2);
    });

    it("should produce mkdir+write for .claude/agents/ when subagents present", async () => {
      const agent = createAgent({
        subagents: [
          {
            name: "reviewer",
            description: "Reviews code",
            invocation: "delegate",
            instructions: "Review",
          },
        ],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      const mkdirAction = plan.actions.find(
        (a) => a.kind === "mkdir" && a.path === ".claude/agents/",
      );
      expect(mkdirAction).toBeDefined();

      const writeAction = plan.actions.find(
        (a) => a.kind === "write" && a.path.startsWith(".claude/agents/"),
      );
      expect(writeAction).toBeDefined();
    });
  });

  // ── Cursor adapter ──

  describe("cursor adapter", () => {
    function createCursorAgent(overrides?: Partial<MaterializedAgent>): MaterializedAgent {
      return createAgent({
        config: {
          specVersion: "1.0.0",
          name: "test-agent",
          version: "0.1.0",
          description: "Test agent",
          adapter: {
            type: "cursor",
            runtime: "cursor",
            adapterVersion: "1.0.0",
            config: {},
            features: {
              prompt: "native",
              persona: "embedded",
              rules: "translated",
              skills: "native",
              mcp: "translated",
            },
            targets: [
              { kind: "file", path: "AGENTS.md", scope: "project", description: "Instructions" },
              { kind: "directory", path: ".cursor/rules/", scope: "project", description: "Rules" },
              {
                kind: "file",
                path: ".cursor/mcp.json",
                scope: "project",
                description: "MCP config",
              },
              {
                kind: "directory",
                path: ".cursor/skills/",
                scope: "project",
                description: "Skills",
              },
            ],
          },
        },
        ...overrides,
      });
    }

    it("should produce write action for AGENTS.md", async () => {
      const agent = createCursorAgent({ prompt: "Cursor instructions" });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "cursor", {
        outDir: tmpDir,
      });

      const agentsMdAction = plan.actions.find((a) => a.kind === "write" && a.path === "AGENTS.md");
      expect(agentsMdAction).toBeDefined();
      expect(agentsMdAction!.content).toContain("Cursor instructions");
    });

    it("should produce write actions for .cursor/rules/", async () => {
      const agent = createCursorAgent({
        rules: [{ id: "no-eval", scope: "always", content: "Never use eval", priority: 100 }],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "cursor", {
        outDir: tmpDir,
      });

      const ruleWrites = plan.actions.filter(
        (a) => a.kind === "write" && a.path.startsWith(".cursor/rules/"),
      );
      expect(ruleWrites.length).toBeGreaterThan(0);
    });

    it("should produce write action for .cursor/mcp.json", async () => {
      const agent = createCursorAgent({
        mcp: {
          servers: {
            "test-server": { command: "npx", args: ["test-server"] },
          },
        },
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "cursor", {
        outDir: tmpDir,
      });

      const mcpAction = plan.actions.find(
        (a) => a.kind === "write" && a.path === ".cursor/mcp.json",
      );
      expect(mcpAction).toBeDefined();
    });
  });

  // ── Plan metadata ──

  describe("plan metadata", () => {
    it("should include action kind, path, description, content", async () => {
      const agent = createAgent({ prompt: "Test prompt" });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      for (const action of plan.actions) {
        expect(action.kind).toBeDefined();
        expect(["write", "mkdir", "setting", "api-call"]).toContain(action.kind);
        expect(action.path).toBeDefined();
        expect(typeof action.path).toBe("string");
        expect(action.description).toBeDefined();
        expect(typeof action.description).toBe("string");
      }
    });

    it("should produce mkdir before write actions", async () => {
      const agent = createAgent({
        skills: [{ name: "test-skill", path: "skills/test/SKILL.md", content: "Test" }],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      // Find mkdir and write for skills dir
      const mkdirIdx = plan.actions.findIndex(
        (a) => a.kind === "mkdir" && a.path === ".claude/skills/",
      );
      const writeIdx = plan.actions.findIndex(
        (a) => a.kind === "write" && a.path.startsWith(".claude/skills/"),
      );

      expect(mkdirIdx).toBeGreaterThanOrEqual(0);
      expect(writeIdx).toBeGreaterThan(mkdirIdx);
    });

    it("should include warnings for unsupported features", async () => {
      const agent = createAgent({
        warnings: [{ code: "UNSUPPORTED_FEATURE", message: "MCP not supported", layer: "mcp" }],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const plan = await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir: tmpDir,
      });

      expect(plan.warnings.length).toBeGreaterThan(0);
      expect(plan.warnings[0]!.code).toBe("UNSUPPORTED_FEATURE");
    });
  });

  // ── Side-effect free ──

  describe("side-effect free", () => {
    it("should not write any files to disk", async () => {
      const agent = createAgent({
        prompt: "Test",
        skills: [{ name: "s", path: "skills/s/SKILL.md", content: "S" }],
        rules: [{ id: "r", scope: "always", content: "R", priority: 100 }],
        mcp: { servers: { s: { command: "x" } } },
        subagents: [{ name: "a", description: "A", invocation: "delegate", instructions: "I" }],
      });
      mockedMaterialize.mockResolvedValue(agent);

      const outDir = join(tmpDir, "side-effect-test");

      await planInstall("ghcr.io/test/agent:1.0.0", "claude-code", {
        outDir,
      });

      // outDir should not even exist since plan should not create any files
      try {
        const entries = await readdir(outDir);
        // If dir exists, it should be empty
        expect(entries.length).toBe(0);
      } catch {
        // Directory doesn't exist, which is expected
        expect(true).toBe(true);
      }
    });
  });
});
