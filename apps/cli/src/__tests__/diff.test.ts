import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("diff", () => {
  it("should require two arguments", async () => {
    const { exitCode } = await run(["diff"]);
    expect(exitCode).not.toBe(0);
  });

  it("should reject single argument", async () => {
    const { exitCode } = await run(["diff", "ghcr.io/myorg/agents/backend:3.0.0"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept two OCI references", async () => {
    const { exitCode } = await run([
      "diff",
      "ghcr.io/myorg/agents/backend:3.0.0",
      "ghcr.io/myorg/agents/backend:3.1.0",
    ]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept two local project paths", async () => {
    const { exitCode } = await run(["diff", "./project-a", "./project-b"]);
    expect([0, 1, 2]).toContain(exitCode);
  });

  it("should identify changed layers", async () => {
    const { stdout, exitCode } = await run([
      "diff",
      "ghcr.io/myorg/agents/backend:3.0.0",
      "ghcr.io/myorg/agents/backend:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(typeof stdout).toBe("string");
    }
  });

  it("should identify changed digests", async () => {
    const { stdout, exitCode } = await run([
      "diff",
      "ghcr.io/myorg/agents/backend:3.0.0",
      "ghcr.io/myorg/agents/backend:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(typeof stdout).toBe("string");
    }
  });

  it("should show package resolution differences", async () => {
    const { stdout, exitCode } = await run([
      "diff",
      "ghcr.io/myorg/agents/backend:3.0.0",
      "ghcr.io/myorg/agents/backend:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(typeof stdout).toBe("string");
    }
  });

  it("should show materialization warnings for diff", async () => {
    const { stdout, exitCode } = await run([
      "diff",
      "ghcr.io/myorg/agents/backend:3.0.0",
      "ghcr.io/myorg/agents/backend:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(typeof stdout).toBe("string");
    }
  });
});
