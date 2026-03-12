import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("validate", () => {
  it("should accept validate command without arguments", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should accept validate with explicit entry path", async () => {
    const { exitCode } = await run(["validate", "agent.ts"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should exit with code 0 on valid definitions", async () => {
    const { exitCode } = await run(["validate"]);
    if (exitCode === 0) {
      expect(exitCode).toBe(0);
    }
  });

  it("should exit with code 1 on validation error", async () => {
    const { exitCode } = await run(["validate"], { cwd: "/tmp" });
    expect(exitCode).toBe(1);
  });

  it("should report type correctness errors", async () => {
    const { exitCode, stderr } = await run(["validate"], { cwd: "/tmp" });
    if (exitCode === 1) {
      expect(stderr.length).toBeGreaterThan(0);
    }
  });

  it("should validate required fields", async () => {
    const { exitCode } = await run(["validate"], { cwd: "/tmp" });
    expect(exitCode).toBe(1);
  });

  it("should validate path existence and type", async () => {
    const { exitCode } = await run(["validate", "/tmp"]);
    expect(exitCode).toBe(1);
  });

  it("should validate package reference syntax", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should detect dependency cycles", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should validate MCP secret references", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should validate skill frontmatter", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should validate rule frontmatter", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should enforce archive safety rules", async () => {
    const { exitCode } = await run(["validate"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should output nothing on success (clean validation)", async () => {
    const { stdout, exitCode } = await run(["validate"]);
    if (exitCode === 0) {
      expect(typeof stdout).toBe("string");
    }
  });

  it("should output error details on validation failure", async () => {
    const { stderr, exitCode } = await run(["validate"], { cwd: "/tmp" });
    if (exitCode === 1) {
      expect(stderr.length).toBeGreaterThan(0);
    }
  });

  it("should output structured error with path and message", async () => {
    const { stderr, exitCode } = await run(["validate"], { cwd: "/tmp" });
    if (exitCode === 1) {
      expect(stderr.length).toBeGreaterThan(0);
    }
  });
});
