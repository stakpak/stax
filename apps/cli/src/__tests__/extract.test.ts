import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("extract", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["extract"]);
    expect(exitCode).not.toBe(0);
  });

  it("should require an output directory argument", async () => {
    const { exitCode } = await run(["extract", "ghcr.io/myorg/agents/backend:3.1.0"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept reference and output dir", async () => {
    const { exitCode } = await run([
      "extract",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "/tmp/stax-extract-test",
    ]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should exit with code 3 for unreachable registry", async () => {
    const { exitCode } = await run([
      "extract",
      "nonexistent.registry.invalid/agents/test:1.0.0",
      "/tmp/stax-extract-test",
    ]);
    expect(exitCode).toBe(3);
  });
});
