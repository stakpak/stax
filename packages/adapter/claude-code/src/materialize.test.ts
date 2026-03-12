import { describe, expect, it } from "vitest";
import { materialize } from "./materialize.ts";
import type { MaterializeContext } from "@stax/adapter-core";

function createContext(overrides?: Partial<MaterializeContext>): MaterializeContext {
  return {
    outDir: "/tmp/test",
    prompt: "You are a helpful assistant.",
    persona: { name: "helper", displayName: "Helper", role: "Assistant" },
    mcp: {
      servers: {
        "test-server": {
          command: "npx",
          args: ["-y", "test-mcp"],
          env: { KEY: "val" },
        },
      },
    },
    skills: [{ name: "search", description: "Search skill", content: "Search for things" }],
    rules: [{ id: "rule-1", scope: "always", content: "Always be helpful", priority: 100 }],
    subagents: [
      {
        name: "researcher",
        description: "Research agent",
        invocation: "delegate",
        instructions: "Do research",
      },
    ],
    secrets: [{ key: "API_KEY", required: true, description: "API key" }],
    surfaces: [{ name: "instructions", content: "Custom instructions" }],
    knowledge: [],
    memory: [],
    instructionTree: [],
    ...overrides,
  };
}

describe("claude-code materialize", () => {
  it("should write CLAUDE.md from prompt", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("CLAUDE.md")).toBe(true);
    expect(result.files.get("CLAUDE.md")).toContain("You are a helpful assistant.");
  });

  it("should embed persona into CLAUDE.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("CLAUDE.md") as string;
    expect(content).toContain("Helper");
    expect(content).toContain("Assistant");
  });

  it("should write CLAUDE.md without persona header when persona is absent", async () => {
    const result = await materialize(createContext({ persona: undefined }));
    const content = result.files.get("CLAUDE.md") as string;
    expect(content).toContain("You are a helpful assistant.");
    expect(content).not.toContain("Helper");
  });

  it("should write .mcp.json with mcpServers key", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".mcp.json")).toBe(true);
    const parsed = JSON.parse(result.files.get(".mcp.json") as string);
    expect(parsed).toHaveProperty("mcpServers");
  });

  it("should map stdio servers to command/args/env", async () => {
    const result = await materialize(createContext());
    const parsed = JSON.parse(result.files.get(".mcp.json") as string);
    const server = parsed.mcpServers["test-server"];
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "test-mcp"]);
    expect(server.env).toEqual({ KEY: "val" });
  });

  it("should map HTTP servers to url/transport", async () => {
    const ctx = createContext({
      mcp: {
        servers: {
          "http-server": { url: "https://example.com", transport: "sse" },
        },
      },
    });
    const result = await materialize(ctx);
    const parsed = JSON.parse(result.files.get(".mcp.json") as string);
    const server = parsed.mcpServers["http-server"];
    expect(server.url).toBe("https://example.com");
    expect(server.transport).toBe("sse");
  });

  it("should write .claude/settings.json", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".claude/settings.json")).toBe(true);
    const parsed = JSON.parse(result.files.get(".claude/settings.json") as string);
    expect(parsed).toEqual({});
  });

  it("should not write .claude/settings.local.json", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".claude/settings.local.json")).toBe(false);
  });

  it("should write each skill to .claude/skills/<name>/SKILL.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".claude/skills/search/SKILL.md")).toBe(true);
    expect(result.files.get(".claude/skills/search/SKILL.md")).toBe("Search for things");
  });

  it("should write each subagent to .claude/agents/<name>.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".claude/agents/researcher.md")).toBe(true);
    const content = result.files.get(".claude/agents/researcher.md") as string;
    expect(content).toContain("researcher");
    expect(content).toContain("Research agent");
    expect(content).toContain("Do research");
  });

  it("should append rules to CLAUDE.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("CLAUDE.md") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should not write .mcp.json when mcp is absent", async () => {
    const result = await materialize(createContext({ mcp: undefined }));
    expect(result.files.has(".mcp.json")).toBe(false);
  });

  it("should not write skills when skills is absent", async () => {
    const result = await materialize(createContext({ skills: undefined }));
    const hasSkill = [...result.files.keys()].some((k) => k.startsWith(".claude/skills/"));
    expect(hasSkill).toBe(false);
  });

  it("should not write subagents when subagents is absent", async () => {
    const result = await materialize(createContext({ subagents: undefined }));
    const hasAgent = [...result.files.keys()].some((k) => k.startsWith(".claude/agents/"));
    expect(hasAgent).toBe(false);
  });

  it("should return empty warnings by default", async () => {
    const result = await materialize(createContext());
    expect(result.warnings).toEqual([]);
  });

  it("should handle empty context gracefully", async () => {
    const result = await materialize({ outDir: "/tmp/test" });
    expect(result.files.has(".claude/settings.json")).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
