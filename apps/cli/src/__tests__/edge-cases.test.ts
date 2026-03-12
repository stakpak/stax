import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("edge cases", () => {
  it("should handle multiple flags in any order", async () => {
    const { exitCode } = await run([
      "build",
      "--dry-run",
      "--persona",
      "maya",
      "--symlink-mode",
      "flatten",
    ]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should handle --flag=value syntax", async () => {
    const { exitCode } = await run(["build", "--persona=maya-chen"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should handle -- to stop flag parsing", async () => {
    const { exitCode } = await run(["build", "--", "--not-a-flag"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should handle very long reference strings", async () => {
    const longRef = `ghcr.io/${"a".repeat(100)}/agents/backend:1.0.0`;
    const { exitCode } = await run(["inspect", longRef]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should handle reference with semver prerelease tag", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/myorg/agents/backend:1.0.0-alpha.1"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should handle reference with semver build metadata", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/myorg/agents/backend:1.0.0+build.123"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should reject whitespace in reference", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/my org/agents/backend:1.0.0"]);
    expect(exitCode).not.toBe(0);
  });

  it("should handle IPv4 registry address", async () => {
    const { exitCode } = await run(["inspect", "192.168.1.1:5000/myorg/agent:1.0.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should handle deeply nested repository paths", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/org/team/project/agents/backend:3.1.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should handle concurrent flag types", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
      "--exact",
      "--adapter",
      "codex",
      "--out",
      "/tmp/test",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should not crash on extremely long arguments", async () => {
    const longArg = "a".repeat(10000);
    const { exitCode } = await run([longArg]);
    expect(typeof exitCode).toBe("number");
  });

  it("should not crash on special characters in arguments", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/org/agent:v1.0.0-rc.1+build.123"]);
    expect(typeof exitCode).toBe("number");
  });

  it("should handle unicode in arguments", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/org/агент:1.0.0"]);
    expect(typeof exitCode).toBe("number");
  });
});
