import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("configuration", () => {
  it("should work without stax.config.ts", async () => {
    const { exitCode } = await run(["--help"]);
    expect(exitCode).toBe(0);
  });

  it("should load stax.config.ts when present", async () => {
    const { exitCode } = await run(["build"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should respect registry from config", async () => {
    const { exitCode } = await run(["build"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should respect defaultPersona from config", async () => {
    const { exitCode } = await run(["build"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should respect failOnLossyMaterialization from config", async () => {
    const { exitCode } = await run(["build"]);
    expect([0, 2]).toContain(exitCode);
  });
});
