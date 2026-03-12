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

describe("windsurf materialize", () => {
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

  it("should write rules to .windsurf/rules/<id>.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".windsurf/rules/rule-1.md")).toBe(true);
    const content = result.files.get(".windsurf/rules/rule-1.md") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should translate skills to .windsurf/workflows/<name>.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".windsurf/workflows/search.md")).toBe(true);
    expect(result.files.get(".windsurf/workflows/search.md")).toContain("Search for things");
  });

  it("should embed MCP servers into AGENTS.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("AGENTS.md") as string;
    expect(content).toContain("test-server");
  });

  it("should handle empty context gracefully", async () => {
    const result = await materialize({ outDir: "/tmp/test" });
    expect(result.warnings).toEqual([]);
  });

  it("should not write rules when rules is absent", async () => {
    const result = await materialize(createContext({ rules: undefined }));
    const hasRules = [...result.files.keys()].some((k) => k.startsWith(".windsurf/rules/"));
    expect(hasRules).toBe(false);
  });

  it("should not write workflows when skills is absent", async () => {
    const result = await materialize(createContext({ skills: undefined }));
    const hasWorkflows = [...result.files.keys()].some((k) => k.startsWith(".windsurf/workflows/"));
    expect(hasWorkflows).toBe(false);
  });

  it("should return empty warnings by default", async () => {
    const result = await materialize(createContext());
    expect(result.warnings).toEqual([]);
  });
});
