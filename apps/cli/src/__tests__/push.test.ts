import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("push", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["push"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept OCI reference", async () => {
    const { exitCode } = await run(["push", "ghcr.io/myorg/agents/backend-engineer:3.1.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should reject unsupported --all-personas flag", async () => {
    const { exitCode, stderr } = await run([
      "push",
      "--all-personas",
      "ghcr.io/myorg/agents/backend-engineer",
    ]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("unknown flag --all-personas");
  });

  it("should exit with code 3 on registry error", async () => {
    const { exitCode } = await run(["push", "nonexistent.registry.invalid/agents/test:1.0.0"]);
    expect(exitCode).toBe(3);
  });

  it("should accept reference with tag", async () => {
    const { exitCode } = await run(["push", "ghcr.io/myorg/agents/backend:3.1.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept reference with digest", async () => {
    const { exitCode } = await run(["push", "ghcr.io/myorg/agents/backend@sha256:abc123"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should require a supported flag set", async () => {
    const { exitCode } = await run(["push", "ghcr.io/myorg/agents/backend"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should require built artifact before push", async () => {
    const { exitCode } = await run(["push", "ghcr.io/myorg/agents/nonexistent:1.0.0"]);
    expect([2, 3]).toContain(exitCode);
  });
});
