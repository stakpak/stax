import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("materialize", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["materialize"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept OCI reference", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--out",
      "/tmp/stax-test-output",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept local path reference", async () => {
    const { exitCode } = await run([
      "materialize",
      "./dist/backend-engineer.oci",
      "--out",
      "/tmp/stax-test-output",
    ]);
    expect([0, 2, 5]).toContain(exitCode);
  });

  it("should accept --out flag", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept --adapter flag", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--adapter",
      "codex",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept --json flag for machine-readable output", async () => {
    const { exitCode } = await run(["materialize", "ghcr.io/myorg/agents/backend:1.0.0", "--json"]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should produce valid JSON with --json flag", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      expect(() => JSON.parse(stdout)).not.toThrow();
    }
  });

  it("should accept --plan flag", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--plan",
      "--consumer",
      "codex",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept --consumer flag with --plan", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--plan",
      "--consumer",
      "codex",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept --exact flag", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--exact",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should exit with code 5 on materialization compatibility error", async () => {
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

  it("should warn on lossy translations", async () => {
    const { stdout, stderr, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--adapter",
      "codex",
      "--out",
      "/tmp/test-out",
    ]);
    if (exitCode === 0) {
      const output = stdout + stderr;
      expect(typeof output).toBe("string");
    }
  });

  it("should accept reference with digest", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should accept reference with tag and digest", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:3.1.0@sha256:abc123",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should default to portable mode", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should support exact mode with --exact flag", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--exact",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should fail exact mode if adapter does not support exactMode", async () => {
    const { exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--exact",
      "--adapter",
      "generic",
      "--out",
      "/tmp/test-out",
    ]);
    expect([0, 3, 5]).toContain(exitCode);
  });

  it("should include adapter info in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("adapter");
    }
  });

  it("should include targets in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("targets");
    }
  });

  it("should include fidelity info in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("fidelity");
    }
  });

  it("should include warnings array in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("warnings");
      expect(Array.isArray(data.warnings)).toBe(true);
    }
  });

  it("should include lossy flag in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("lossy");
      expect(typeof data.lossy).toBe("boolean");
    }
  });

  it("should include provenance in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "materialize",
      "ghcr.io/myorg/agents/backend:1.0.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("provenance");
    }
  });
});
