import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("unknown commands", () => {
  it("should exit with non-zero for unknown command", async () => {
    const { exitCode } = await run(["nonexistent"]);
    expect(exitCode).not.toBe(0);
  });

  it("should print error message for unknown command", async () => {
    const { stderr } = await run(["nonexistent"]);
    expect(stderr).toContain("Unknown command");
    expect(stderr).toContain("nonexistent");
  });

  it("should exit with non-zero for 'foobar'", async () => {
    const { exitCode } = await run(["foobar"]);
    expect(exitCode).not.toBe(0);
  });

  it("should include the unknown command name in error", async () => {
    const { stderr } = await run(["xyz123"]);
    expect(stderr).toContain("xyz123");
  });

  it("should handle empty string argument", async () => {
    const { exitCode } = await run([""]);
    expect(exitCode).not.toBe(0);
  });

  it("should reject commands with wrong casing", async () => {
    const { exitCode } = await run(["Version"]);
    expect(exitCode).not.toBe(0);
  });

  it("should reject commands with wrong casing BUILD", async () => {
    const { exitCode } = await run(["BUILD"]);
    expect(exitCode).not.toBe(0);
  });
});
