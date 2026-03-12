import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("version", () => {
  it("should show version with 'version' command", async () => {
    const { stdout, exitCode } = await run(["version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("0.0.1");
  });

  it("should show version with --version flag", async () => {
    const { stdout, exitCode } = await run(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("0.0.1");
  });

  it("should show version with -V flag", async () => {
    const { stdout, exitCode } = await run(["-V"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("0.0.1");
  });

  it("should output version string in semver format", async () => {
    const { stdout } = await run(["version"]);
    expect(stdout).toMatch(/\d+\.\d+\.\d+/);
  });

  it("should include 'stax' in version output", async () => {
    const { stdout } = await run(["version"]);
    expect(stdout).toContain("stax");
  });
});
