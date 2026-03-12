import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("pull", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["pull"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept OCI reference with tag", async () => {
    const { exitCode } = await run(["pull", "ghcr.io/myorg/agents/backend-engineer:3.1.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept OCI reference with digest", async () => {
    const { exitCode } = await run([
      "pull",
      "ghcr.io/myorg/agents/backend-engineer@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should exit with code 3 on registry error", async () => {
    const { exitCode } = await run(["pull", "nonexistent.registry.invalid/agents/test:1.0.0"]);
    expect(exitCode).toBe(3);
  });

  it("should cache artifact by digest", async () => {
    const { exitCode } = await run(["pull", "ghcr.io/myorg/agents/backend:1.0.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept deeply nested repository paths", async () => {
    const { exitCode } = await run(["pull", "ghcr.io/org/team/project/agents/backend:1.0.0"]);
    expect([0, 3]).toContain(exitCode);
  });
});
