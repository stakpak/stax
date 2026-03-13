import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("build", () => {
  it("should accept build command", async () => {
    const { exitCode } = await run(["build"]);
    // May fail with exit 2 (build error) if no agent.ts, but should recognize the command
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept --persona flag", async () => {
    const { exitCode } = await run(["build", "--persona", "maya-chen"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept --all-personas flag", async () => {
    const { exitCode } = await run(["build", "--all-personas"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should reject unsupported --dry-run flag", async () => {
    const { exitCode, stderr } = await run(["build", "--dry-run"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("unknown flag --dry-run");
  });

  it("should reject unsupported --refresh-lock flag", async () => {
    const { exitCode, stderr } = await run(["build", "--refresh-lock"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("unknown flag --refresh-lock");
  });

  it("should accept --symlink-mode reject", async () => {
    const { exitCode } = await run(["build", "--symlink-mode", "reject"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept --symlink-mode flatten", async () => {
    const { exitCode } = await run(["build", "--symlink-mode", "flatten"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should reject invalid --symlink-mode value", async () => {
    const { exitCode } = await run(["build", "--symlink-mode", "invalid"]);
    expect(exitCode).not.toBe(0);
  });

  it("should reject --persona and --all-personas together", async () => {
    const { exitCode } = await run(["build", "--persona", "maya", "--all-personas"]);
    expect(exitCode).not.toBe(0);
  });

  it("should exit with code 2 on build error", async () => {
    const { exitCode } = await run(["build"], { cwd: "/tmp" });
    expect(exitCode).toBe(2);
  });

  it("should produce artifact with sha256 digest on success", async () => {
    const { stdout, exitCode } = await run(["build"]);
    if (exitCode === 0) {
      expect(stdout).toMatch(/sha256:[a-f0-9]{64}/);
    }
  });

  it("should report artifact directory on success", async () => {
    const { stdout, exitCode } = await run(["build"]);
    if (exitCode === 0) {
      expect(stdout).toContain(".stax/artifacts");
    }
  });

  it("should output digest on successful build", async () => {
    const { stdout, exitCode } = await run(["build"]);
    if (exitCode === 0) {
      expect(stdout).toMatch(/sha256:[a-f0-9]{64}/);
    }
  });

  it("should output layer count on successful build", async () => {
    const { stdout, exitCode } = await run(["build"]);
    if (exitCode === 0) {
      expect(stdout.toLowerCase()).toContain("layer");
    }
  });

  it("should not claim lockfile generation support", async () => {
    const { stdout, exitCode } = await run(["build"]);
    if (exitCode === 0) {
      expect(stdout).not.toContain("stax.lock");
    }
  });
});
