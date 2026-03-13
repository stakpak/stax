import { describe, expect, it } from "vitest";
import { mergeLayers } from "./merge.ts";

describe("mergeLayers", () => {
  it("should merge MCP servers — higher priority replaces by server name", () => {
    const result = mergeLayers([
      { mcp: { servers: { github: { command: "old" } } } },
      { mcp: { servers: { github: { command: "new" } } } },
    ]);

    expect((result.mcp as any).servers.github.command).toBe("new");
  });

  it("should merge skills — higher priority replaces by skill dir name", () => {
    const result = mergeLayers([
      { skills: [{ name: "review", content: "old" }] },
      { skills: [{ name: "review", content: "new" }] },
    ]);

    const review = (result.skills as any[])!.find((s) => s.name === "review");
    expect(review.content).toBe("new");
  });

  it("should merge rules — higher priority replaces by rule id", () => {
    const result = mergeLayers([
      { rules: [{ id: "no-eval", content: "old" }] },
      { rules: [{ id: "no-eval", content: "new" }] },
    ]);

    const rule = (result.rules as any[])!.find((r) => r.id === "no-eval");
    expect(rule.content).toBe("new");
  });

  it("should append non-conflicting rules", () => {
    const result = mergeLayers([
      { rules: [{ id: "rule-a", content: "a" }] },
      { rules: [{ id: "rule-b", content: "b" }] },
    ]);

    expect(result.rules).toHaveLength(2);
  });

  it("should merge secrets — higher priority replaces by key", () => {
    const result = mergeLayers([
      { secrets: [{ key: "TOKEN", required: false }] },
      { secrets: [{ key: "TOKEN", required: true }] },
    ]);

    const token = (result.secrets as any[])!.find((s) => s.key === "TOKEN");
    expect(token.required).toBe(true);
  });

  it("should handle empty package list", () => {
    const result = mergeLayers([]);
    expect(result.warnings).toEqual([]);
  });

  it("should merge knowledge — higher priority replaces by path", () => {
    const result = mergeLayers([
      { knowledge: [{ path: "docs/guide.md", content: "old" }] },
      { knowledge: [{ path: "docs/guide.md", content: "new" }] },
    ]);

    const doc = (result.knowledge as any[])!.find((k) => k.path === "docs/guide.md");
    expect(doc.content).toBe("new");
  });

  it("should append non-conflicting knowledge", () => {
    const result = mergeLayers([
      { knowledge: [{ path: "docs/a.md", content: "a" }] },
      { knowledge: [{ path: "docs/b.md", content: "b" }] },
    ]);

    expect(result.knowledge).toHaveLength(2);
  });

  it("should merge surfaces — higher priority replaces by basename", () => {
    const result = mergeLayers([
      { surfaces: [{ name: "instructions.md", content: "old" }] },
      { surfaces: [{ name: "instructions.md", content: "new" }] },
    ]);

    const surface = (result.surfaces as any[])!.find((s) => s.name === "instructions.md");
    expect(surface.content).toBe("new");
  });

  it("should append non-conflicting surfaces", () => {
    const result = mergeLayers([
      { surfaces: [{ name: "instructions.md", content: "inst" }] },
      { surfaces: [{ name: "persona.md", content: "persona" }] },
    ]);

    expect(result.surfaces).toHaveLength(2);
  });

  it("should handle three-way merge with correct priority", () => {
    const result = mergeLayers([
      { rules: [{ id: "rule-1", content: "base" }] },
      { rules: [{ id: "rule-1", content: "middle" }] },
      { rules: [{ id: "rule-1", content: "top" }] },
    ]);

    const rule = (result.rules as any[])!.find((r) => r.id === "rule-1");
    expect(rule.content).toBe("top");
  });

  it("should merge MCP adding non-conflicting servers", () => {
    const result = mergeLayers([
      { mcp: { servers: { github: { command: "gh" } } } },
      { mcp: { servers: { slack: { command: "slack" } } } },
    ]);

    expect((result.mcp as any).servers.github).toBeDefined();
    expect((result.mcp as any).servers.slack).toBeDefined();
  });

  it("should merge secrets replacing entire declaration on conflict", () => {
    const result = mergeLayers([
      {
        secrets: [
          {
            key: "API_KEY",
            required: false,
            description: "old desc",
            kind: "api-key",
          },
        ],
      },
      {
        secrets: [
          {
            key: "API_KEY",
            required: true,
            description: "new desc",
            kind: "token",
          },
        ],
      },
    ]);

    const secret = (result.secrets as any[])!.find((s) => s.key === "API_KEY");
    expect(secret.required).toBe(true);
    expect(secret.description).toBe("new desc");
    expect(secret.kind).toBe("token");
  });

  it("should append non-conflicting secrets", () => {
    const result = mergeLayers([
      { secrets: [{ key: "KEY_A", required: true }] },
      { secrets: [{ key: "KEY_B", required: false }] },
    ]);

    expect(result.secrets).toHaveLength(2);
  });

  it("should produce warnings on merge", () => {
    const result = mergeLayers([
      { mcp: { servers: { github: { command: "old" } } } },
      { mcp: { servers: { github: { command: "new" } } } },
    ]);

    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("should merge skills appending non-conflicting skills", () => {
    const result = mergeLayers([
      { skills: [{ name: "review", content: "review" }] },
      { skills: [{ name: "deploy", content: "deploy" }] },
    ]);

    expect(result.skills).toHaveLength(2);
  });

  it("should sort rules by byte-wise UTF-8 ordering, not locale (spec 05/08)", () => {
    // Uppercase 'Z' (0x5A) sorts before lowercase 'a' (0x61) in byte order
    // but localeCompare may sort 'a' before 'Z' depending on locale
    const result = mergeLayers([
      {
        rules: [
          { id: "a-rule", archivePath: "a-rule.md", priority: 0, content: "a" },
          { id: "Z-rule", archivePath: "Z-rule.md", priority: 0, content: "Z" },
        ],
      },
    ]);

    const ids = (result.rules as { id: string }[])!.map((r) => r.id);
    // In byte-wise order: 'Z' (0x5A) < 'a' (0x61)
    expect(ids).toEqual(["Z-rule", "a-rule"]);
  });

  it("should merge instruction trees — higher priority replaces by path (spec 05)", () => {
    const result = mergeLayers([
      { instructionTree: [{ path: "src/AGENTS.md", content: "old" }] },
      { instructionTree: [{ path: "src/AGENTS.md", content: "new" }] },
    ]);

    const item = (result.instructionTree as any[])!.find((i) => i.path === "src/AGENTS.md");
    expect(item.content).toBe("new");
  });

  it("should append non-conflicting instruction tree entries", () => {
    const result = mergeLayers([
      { instructionTree: [{ path: "src/AGENTS.md", content: "src" }] },
      { instructionTree: [{ path: "lib/AGENTS.md", content: "lib" }] },
    ]);

    expect(result.instructionTree).toHaveLength(2);
  });

  it("should merge subagents — higher priority replaces by name (spec 05)", () => {
    const result = mergeLayers([
      { subagents: [{ name: "reviewer", instructions: "old" }] },
      { subagents: [{ name: "reviewer", instructions: "new" }] },
    ]);

    const agent = (result.subagents as any[])!.find((a) => a.name === "reviewer");
    expect(agent.instructions).toBe("new");
  });

  it("should append non-conflicting subagents", () => {
    const result = mergeLayers([
      { subagents: [{ name: "reviewer", instructions: "review" }] },
      { subagents: [{ name: "deployer", instructions: "deploy" }] },
    ]);

    expect(result.subagents).toHaveLength(2);
  });

  it("should sort rules with non-ASCII paths by raw byte order (spec 05/08)", () => {
    const result = mergeLayers([
      {
        rules: [
          { id: "ü-rule", archivePath: "ü-rule.md", priority: 0, content: "ü" },
          { id: "b-rule", archivePath: "b-rule.md", priority: 0, content: "b" },
        ],
      },
    ]);

    const ids = (result.rules as { id: string }[])!.map((r) => r.id);
    // 'b' is 0x62, 'ü' in UTF-8 is 0xC3 0xBC — so 'b' sorts first
    expect(ids).toEqual(["b-rule", "ü-rule"]);
  });
});
