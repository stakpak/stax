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

describe("cursor materialize", () => {
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

  it("should write rules to .cursor/rules/<id>.mdc", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".cursor/rules/rule-1.mdc")).toBe(true);
    const content = result.files.get(".cursor/rules/rule-1.mdc") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should include frontmatter in .mdc rule files", async () => {
    const ctx = createContext({
      rules: [
        {
          id: "scoped-rule",
          scope: "glob",
          globs: ["*.ts"],
          content: "Use TypeScript",
          description: "TS rule",
        },
      ],
    });
    const result = await materialize(ctx);
    const content = result.files.get(".cursor/rules/scoped-rule.mdc") as string;
    expect(content).toContain("---");
    expect(content).toContain("globs:");
  });

  it("should write .cursor/mcp.json", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".cursor/mcp.json")).toBe(true);
    const parsed = JSON.parse(result.files.get(".cursor/mcp.json") as string);
    expect(parsed).toHaveProperty("mcpServers");
  });

  it("should map stdio servers correctly in mcp.json", async () => {
    const result = await materialize(createContext());
    const parsed = JSON.parse(result.files.get(".cursor/mcp.json") as string);
    const server = parsed.mcpServers["test-server"];
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "test-mcp"]);
  });

  it("should write skills to .cursor/skills/<name>.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".cursor/skills/search.md")).toBe(true);
    expect(result.files.get(".cursor/skills/search.md")).toContain("Search for things");
  });

  it("should not write mcp.json when mcp is absent", async () => {
    const result = await materialize(createContext({ mcp: undefined }));
    expect(result.files.has(".cursor/mcp.json")).toBe(false);
  });

  it("should handle empty context gracefully", async () => {
    const result = await materialize({ outDir: "/tmp/test" });
    expect(result.warnings).toEqual([]);
  });

  it("should return empty warnings by default", async () => {
    const result = await materialize(createContext());
    expect(result.warnings).toEqual([]);
  });
});
