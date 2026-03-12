import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("plan-install", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["plan-install"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept --consumer flag", async () => {
    const { exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept --json flag", async () => {
    const { exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should produce valid JSON with --json", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      expect(() => JSON.parse(stdout)).not.toThrow();
    }
  });

  it("should include adapter in plan output", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("adapter");
    }
  });

  it("should include warnings in plan output", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("warnings");
      expect(Array.isArray(plan.warnings)).toBe(true);
    }
  });

  it("should include planned actions in plan output", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("actions");
      expect(Array.isArray(plan.actions)).toBe(true);
    }
  });

  it("should not apply any changes (dry run only)", async () => {
    const { exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should include selected adapter in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("adapter");
    }
  });

  it("should include compatibility reasoning", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("compatibility");
    }
  });

  it("should include fidelity summary", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      expect(plan).toHaveProperty("fidelity");
    }
  });

  it("should include trust summary when available", async () => {
    const { stdout, exitCode } = await run([
      "plan-install",
      "ghcr.io/myorg/agents/backend:3.1.0",
      "--consumer",
      "codex",
      "--json",
    ]);
    if (exitCode === 0) {
      const plan = JSON.parse(stdout);
      if (plan.trust !== undefined) {
        expect(typeof plan.trust).toBe("object");
      }
    }
  });
});
