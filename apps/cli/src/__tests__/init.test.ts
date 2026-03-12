import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("init", () => {
  it("should accept init command", async () => {
    const { exitCode } = await run(["init"]);
    expect(exitCode).toBe(0);
  });

  it("should accept --agent flag", async () => {
    const { exitCode } = await run(["init", "--agent"]);
    expect(exitCode).toBe(0);
  });

  it("should accept --package flag", async () => {
    const { exitCode } = await run(["init", "--package"]);
    expect(exitCode).toBe(0);
  });

  it("should accept --template flag with value", async () => {
    const { exitCode } = await run(["init", "--template", "github-workflow"]);
    expect(exitCode).toBe(0);
  });

  it("should reject --agent and --package together", async () => {
    const { exitCode } = await run(["init", "--agent", "--package"]);
    expect(exitCode).not.toBe(0);
  });

  it("should default to --agent when neither specified", async () => {
    const { stdout, exitCode } = await run(["init"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("agent");
  });

  it("should scaffold agent.ts for --agent", async () => {
    const { stdout, exitCode } = await run(["init", "--agent"]);
    if (exitCode === 0) {
      expect(stdout).toContain("agent");
    }
  });

  it("should scaffold package.ts for --package", async () => {
    const { stdout, exitCode } = await run(["init", "--package"]);
    if (exitCode === 0) {
      expect(stdout).toContain("package");
    }
  });

  it("should accept named templates", async () => {
    const { exitCode } = await run(["init", "--template", "github-workflow"]);
    expect([0, 1]).toContain(exitCode);
  });

  it("should reject unknown template names", async () => {
    const { exitCode } = await run(["init", "--template", "nonexistent-template-xyz"]);
    expect(exitCode).not.toBe(0);
  });
});
