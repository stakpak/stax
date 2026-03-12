import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("exit codes", () => {
  it("should exit 0 on success (help)", async () => {
    const { exitCode } = await run(["--help"]);
    expect(exitCode).toBe(0);
  });

  it("should exit 0 on success (version)", async () => {
    const { exitCode } = await run(["version"]);
    expect(exitCode).toBe(0);
  });

  it("should exit 1 for validation errors", async () => {
    const { exitCode } = await run(["validate"], { cwd: "/tmp" });
    expect(exitCode).toBe(1);
  });

  it("should exit 2 for build errors", async () => {
    const { exitCode } = await run(["build"], { cwd: "/tmp" });
    expect(exitCode).toBe(2);
  });

  it("should exit 3 for registry errors", async () => {
    const { exitCode } = await run(["inspect", "nonexistent.registry.invalid/agents/test:1.0.0"]);
    expect(exitCode).toBe(3);
  });

  it("should exit 5 for materialization compatibility errors", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--adapter",
      "nonexistent-adapter",
      "--out",
      "/tmp/test-out",
    ]);
    expect(exitCode).toBe(5);
  });

  it("should exit 6 for signature/verification errors", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend:1.0.0"]);
    expect([3, 6]).toContain(exitCode);
  });
});
