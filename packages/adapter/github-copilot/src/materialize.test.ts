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

describe("github-copilot materialize", () => {
  it("should write .github/copilot-instructions.md from prompt", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".github/copilot-instructions.md")).toBe(true);
    expect(result.files.get(".github/copilot-instructions.md")).toContain(
      "You are a helpful assistant.",
    );
  });

  it("should embed persona into copilot-instructions.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get(".github/copilot-instructions.md") as string;
    expect(content).toContain("Helper");
    expect(content).toContain("Assistant");
  });

  it("should write .vscode/mcp.json", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".vscode/mcp.json")).toBe(true);
    const parsed = JSON.parse(result.files.get(".vscode/mcp.json") as string);
    expect(parsed).toHaveProperty("servers");
  });

  it("should map stdio servers correctly in mcp.json", async () => {
    const result = await materialize(createContext());
    const parsed = JSON.parse(result.files.get(".vscode/mcp.json") as string);
    const server = parsed.servers["test-server"];
    expect(server.command).toBe("npx");
    expect(server.args).toEqual(["-y", "test-mcp"]);
  });

  it("should map HTTP servers in mcp.json", async () => {
    const ctx = createContext({
      mcp: {
        servers: {
          "http-server": { url: "https://example.com", transport: "sse" },
        },
      },
    });
    const result = await materialize(ctx);
    const parsed = JSON.parse(result.files.get(".vscode/mcp.json") as string);
    const server = parsed.servers["http-server"];
    expect(server.url).toBe("https://example.com");
    expect(server.type).toBe("sse");
  });

  it("should write skills to .github/skills/<name>.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".github/skills/search.md")).toBe(true);
    expect(result.files.get(".github/skills/search.md")).toContain("Search for things");
  });

  it("should write rules to .github/instructions/<id>.instructions.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has(".github/instructions/rule-1.instructions.md")).toBe(true);
    const content = result.files.get(".github/instructions/rule-1.instructions.md") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should write AGENTS.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("AGENTS.md")).toBe(true);
  });

  it("should not write mcp.json when mcp is absent", async () => {
    const result = await materialize(createContext({ mcp: undefined }));
    expect(result.files.has(".vscode/mcp.json")).toBe(false);
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
