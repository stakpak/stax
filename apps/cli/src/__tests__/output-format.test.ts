import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("output format", () => {
  it("should output version to stdout", async () => {
    const { stdout } = await run(["version"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("should output help to stdout", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout.length).toBeGreaterThan(0);
  });

  it("should output errors to stderr", async () => {
    const { stderr } = await run(["nonexistent"]);
    expect(stderr.length).toBeGreaterThan(0);
  });

  it("should output errors to stderr not stdout", async () => {
    const { stdout, stderr } = await run(["nonexistent"]);
    expect(stderr).toContain("Unknown command");
    expect(stdout).not.toContain("Unknown command");
  });

  it("should output JSON to stdout when --json is used", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      expect(() => JSON.parse(stdout)).not.toThrow();
    }
  });

  it("should not mix human-readable and JSON output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const parsed = JSON.parse(stdout);
      expect(typeof parsed).toBe("object");
    }
  });
});
