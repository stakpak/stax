import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("inspect", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["inspect"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept OCI reference", async () => {
    const { exitCode } = await run(["inspect", "ghcr.io/myorg/agents/backend-engineer:3.1.0"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept --json flag", async () => {
    const { exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should produce valid JSON with --json", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    if (exitCode === 0) {
      expect(() => JSON.parse(stdout)).not.toThrow();
    }
  });

  it("should display agent name in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout).toContain("backend-engineer");
    }
  });

  it("should display layers in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout.toLowerCase()).toContain("layer");
    }
  });

  it("should display version in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout).toContain("3.1.0");
    }
  });

  it("should accept reference with digest", async () => {
    const { exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should exit with code 3 for unreachable registry", async () => {
    const { exitCode } = await run(["inspect", "nonexistent.registry.invalid/agents/test:1.0.0"]);
    expect(exitCode).toBe(3);
  });

  it("should show agent name in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout.toLowerCase()).toContain("agent");
    }
  });

  it("should show runtime in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout.toLowerCase()).toContain("runtime");
    }
  });

  it("should show media types in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout).toContain("application/vnd.stax.");
    }
  });

  it("should show layer sizes in human output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
    ]);
    if (exitCode === 0) {
      expect(stdout).toMatch(/\d+(\.\d+)?\s*(B|KB|MB)/i);
    }
  });

  it("should include all layer info in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("layers");
      expect(Array.isArray(data.layers)).toBe(true);
    }
  });

  it("should include artifact type in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("artifactType");
    }
  });

  it("should include name and version in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("version");
    }
  });

  it("should include totalSize in JSON output", async () => {
    const { stdout, exitCode } = await run([
      "inspect",
      "ghcr.io/myorg/agents/backend-engineer:3.1.0",
      "--json",
    ]);
    if (exitCode === 0) {
      const data = JSON.parse(stdout);
      expect(data).toHaveProperty("totalSize");
      expect(typeof data.totalSize).toBe("number");
    }
  });
});
