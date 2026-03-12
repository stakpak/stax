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

describe("opencode materialize", () => {
  it("should write AGENTS.md from prompt", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("AGENTS.md")).toBe(true);
    expect(result.files.get("AGENTS.md")).toContain("You are a helpful assistant.");
  });

  it("should embed persona into AGENTS.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("AGENTS.md") as string;
    expect(content).toContain("Helper");
    expect(content).toContain("Assistant");
  });

  it("should embed rules into AGENTS.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("AGENTS.md") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should write opencode.jsonc with MCP config", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("opencode.jsonc")).toBe(true);
    const content = result.files.get("opencode.jsonc") as string;
    expect(content).toContain("test-server");
  });

  it("should write skills to .opencode/skill/<name>/SKILL.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".opencode/skill/search/SKILL.md")).toBe(true);
    expect(result.files.get(".opencode/skill/search/SKILL.md")).toContain("Search for things");
  });

  it("should not include MCP in opencode.jsonc when mcp is absent", async () => {
    const result = await materialize(createContext({ mcp: undefined }));
    const content = result.files.get("opencode.jsonc") as string;
    const parsed = JSON.parse(content);
    expect(parsed.mcp).toBeUndefined();
  });

  it("should handle empty context gracefully", async () => {
    const result = await materialize({ outDir: "/tmp/test" });
    expect(result.files.has("opencode.jsonc")).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("should return empty warnings by default", async () => {
    const result = await materialize(createContext());
    expect(result.warnings).toEqual([]);
  });
});
