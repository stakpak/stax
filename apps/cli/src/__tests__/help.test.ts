import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("help", () => {
  it("should show help when no arguments are provided", async () => {
    const { stdout, exitCode } = await run([]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("stax");
    expect(stdout).toContain("Usage");
  });

  it("should show help with --help flag", async () => {
    const { stdout, exitCode } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("stax");
  });

  it("should show help with -h flag", async () => {
    const { stdout, exitCode } = await run(["-h"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("stax");
  });

  it("should list all spec commands in help output", async () => {
    const { stdout } = await run(["--help"]);
    const commands = [
      "init",
      "build",
      "validate",
      "materialize",
      "inspect",
      "push",
      "pull",
      "extract",
      "diff",
      "verify",
      "login",
      "version",
    ];
    for (const cmd of commands) {
      expect(stdout).toContain(cmd);
    }
  });

  it("should mention plan-install in help output", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("plan-install");
  });

  it("should mention build-source in help output", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("build-source");
  });

  it("should show help for init command", async () => {
    const { stdout, exitCode } = await run(["init", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("init");
  });

  it("should show help for build command", async () => {
    const { stdout, exitCode } = await run(["build", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("build");
  });

  it("should show help for build-source command", async () => {
    const { stdout, exitCode } = await run(["build-source", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("build-source");
  });

  it("should show help for validate command", async () => {
    const { stdout, exitCode } = await run(["validate", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("validate");
  });

  it("should show help for materialize command", async () => {
    const { stdout, exitCode } = await run(["materialize", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("materialize");
  });

  it("should show help for plan-install command", async () => {
    const { stdout, exitCode } = await run(["plan-install", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("plan-install");
  });

  it("should show help for inspect command", async () => {
    const { stdout, exitCode } = await run(["inspect", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("inspect");
  });

  it("should show help for push command", async () => {
    const { stdout, exitCode } = await run(["push", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("push");
  });

  it("should show help for pull command", async () => {
    const { stdout, exitCode } = await run(["pull", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("pull");
  });

  it("should show help for extract command", async () => {
    const { stdout, exitCode } = await run(["extract", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("extract");
  });

  it("should show help for diff command", async () => {
    const { stdout, exitCode } = await run(["diff", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("diff");
  });

  it("should show help for verify command", async () => {
    const { stdout, exitCode } = await run(["verify", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("verify");
  });

  it("should show help for login command", async () => {
    const { stdout, exitCode } = await run(["login", "--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("login");
  });

  it("should show help when --help is passed to any command", async () => {
    const commands = [
      "init",
      "build",
      "validate",
      "materialize",
      "inspect",
      "push",
      "pull",
      "extract",
      "diff",
      "verify",
      "login",
    ];
    for (const cmd of commands) {
      const { exitCode } = await run([cmd, "--help"]);
      expect(exitCode).toBe(0);
    }
  });
});
