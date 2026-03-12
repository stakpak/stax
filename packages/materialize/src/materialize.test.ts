import { describe, expect, it } from "vitest";
import { materialize } from "./materialize.ts";

describe("materialize", () => {
  it("should produce a MaterializedAgent", async () => {
    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
    });

    expect(result.config).toBeDefined();
    expect(result.config.name).toBeDefined();
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("should include all resolved layers", async () => {
    const result = await materialize({
      source: "ghcr.io/test/full-agent:1.0.0",
      outDir: "./output",
    });

    expect(result.prompt).toBeDefined();
    expect(result.persona).toBeDefined();
    expect(result.skills).toBeInstanceOf(Array);
    expect(result.rules).toBeInstanceOf(Array);
  });

  it("should fail in exact mode when adapter cannot faithfully reproduce", async () => {
    await expect(
      materialize({
        source: "ghcr.io/test/agent:1.0.0",
        outDir: "./output",
        adapter: "incompatible-adapter",
        exact: true,
      }),
    ).rejects.toThrow();
  });

  it("should emit warnings for unsupported features in portable mode", async () => {
    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
      adapter: "limited-adapter",
    });

    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should include config with specVersion", async () => {
    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
    });
    expect(result.config.specVersion).toBeDefined();
  });

  it("should include config with adapter info", async () => {
    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
    });
    expect(result.config.adapter).toBeDefined();
    expect(result.config.adapter.type).toBeDefined();
  });

  it("should include surfaces when present", async () => {
    const result = await materialize({
      source: "ghcr.io/test/full-agent:1.0.0",
      outDir: "./output",
    });
    if (result.surfaces) {
      for (const surface of result.surfaces) {
        expect(surface.name).toBeDefined();
        expect(surface.content).toBeDefined();
      }
    }
  });

  it("should include subagents when present", async () => {
    const result = await materialize({
      source: "ghcr.io/test/full-agent:1.0.0",
      outDir: "./output",
    });
    if (result.subagents) {
      for (const subagent of result.subagents) {
        expect(subagent.name).toBeDefined();
        expect(subagent.description).toBeDefined();
        expect(subagent.instructions).toBeDefined();
      }
    }
  });

  it("should include secrets when present", async () => {
    const result = await materialize({
      source: "ghcr.io/test/full-agent:1.0.0",
      outDir: "./output",
    });
    if (result.secrets) {
      for (const secret of result.secrets) {
        expect(secret.key).toBeDefined();
        expect(typeof secret.required).toBe("boolean");
      }
    }
  });

  it("should have warning objects with code and message", async () => {
    const result = await materialize({
      source: "ghcr.io/test/agent:1.0.0",
      outDir: "./output",
      adapter: "limited-adapter",
    });
    for (const warning of result.warnings) {
      expect(warning.code).toBeDefined();
      expect(warning.message).toBeDefined();
    }
  });
});
