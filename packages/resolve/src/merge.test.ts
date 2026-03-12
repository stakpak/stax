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
});
