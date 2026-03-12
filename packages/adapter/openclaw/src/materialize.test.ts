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

describe("openclaw materialize", () => {
  it("should write AGENTS.md from prompt", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("AGENTS.md")).toBe(true);
    expect(result.files.get("AGENTS.md")).toContain("You are a helpful assistant.");
  });

  it("should write SOUL.md from persona", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("SOUL.md")).toBe(true);
    const content = result.files.get("SOUL.md") as string;
    expect(content).toContain("Helper");
    expect(content).toContain("Assistant");
  });

  it("should not write SOUL.md when persona is absent", async () => {
    const result = await materialize(createContext({ persona: undefined }));
    expect(result.files.has("SOUL.md")).toBe(false);
  });

  it("should write surface files from surfaces array", async () => {
    const ctx = createContext({
      surfaces: [
        { name: "tools", content: "Tool guidance" },
        { name: "identity", content: "Identity info" },
        { name: "user", content: "User profile" },
        { name: "heartbeat", content: "Heartbeat config" },
        { name: "bootstrap", content: "Bootstrap steps" },
      ],
    });
    const result = await materialize(ctx);
    expect(result.files.get("TOOLS.md")).toBe("Tool guidance");
    expect(result.files.get("IDENTITY.md")).toBe("Identity info");
    expect(result.files.get("USER.md")).toBe("User profile");
    expect(result.files.get("HEARTBEAT.md")).toBe("Heartbeat config");
    expect(result.files.get("BOOTSTRAP.md")).toBe("Bootstrap steps");
  });

  it("should write surface files from SurfaceDefinition object", async () => {
    const ctx = createContext({
      surfaces: [
        {
          instructions: "Main instructions",
          persona: "Soul content",
          tools: "Tool guidance",
          identity: "Identity info",
          user: "User profile",
          heartbeat: "Heartbeat config",
          bootstrap: "Bootstrap steps",
        } as unknown,
      ],
    });
    const result = await materialize(ctx);
    expect(result.files.get("TOOLS.md")).toBe("Tool guidance");
    expect(result.files.get("IDENTITY.md")).toBe("Identity info");
  });

  it("should write skills to skills/<name>/SKILL.md", async () => {
    const result = await materialize(createContext());
    expect(result.files.has("skills/search/SKILL.md")).toBe(true);
    expect(result.files.get("skills/search/SKILL.md")).toContain("Search for things");
  });

  it("should write memory files to memory/", async () => {
    const encoder = new TextEncoder();
    const ctx = createContext({
      memory: [{ path: "notes.md", content: encoder.encode("My notes") }],
    });
    const result = await materialize(ctx);
    expect(result.files.has("memory/notes.md")).toBe(true);
  });

  it("should warn that MCP is unsupported", async () => {
    const result = await materialize(createContext());
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.toLowerCase().includes("mcp"))).toBe(true);
  });

  it("should not warn about MCP when mcp is absent", async () => {
    const result = await materialize(createContext({ mcp: undefined }));
    const mcpWarnings = result.warnings.filter((w) => w.toLowerCase().includes("mcp"));
    expect(mcpWarnings).toEqual([]);
  });

  it("should append rules to AGENTS.md", async () => {
    const result = await materialize(createContext());
    const content = result.files.get("AGENTS.md") as string;
    expect(content).toContain("Always be helpful");
  });

  it("should handle empty context gracefully", async () => {
    const result = await materialize({ outDir: "/tmp/test" });
    expect(result.warnings).toEqual([]);
  });
});
