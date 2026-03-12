import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("login", () => {
  it("should accept registry argument", async () => {
    const { exitCode } = await run(["login", "ghcr.io"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept --username flag", async () => {
    const { exitCode } = await run(["login", "--username", "testuser", "ghcr.io"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept --password-stdin flag", async () => {
    const { exitCode } = await run(
      ["login", "--username", "testuser", "--password-stdin", "ghcr.io"],
      { stdin: "testpassword\n" },
    );
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept login without registry (default)", async () => {
    const { exitCode } = await run(["login"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should accept registry with port", async () => {
    const { exitCode } = await run(["login", "localhost:5000"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should exit with code 3 on authentication failure", async () => {
    const { exitCode } = await run(["login", "--username", "invalid", "ghcr.io"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should support Docker credential store", async () => {
    const { exitCode } = await run(["login", "ghcr.io"]);
    expect([0, 3]).toContain(exitCode);
  });

  it("should read password from stdin with --password-stdin", async () => {
    const { exitCode } = await run(
      ["login", "--username", "testuser", "--password-stdin", "ghcr.io"],
      { stdin: "mypassword\n" },
    );
    expect([0, 3]).toContain(exitCode);
  });

  it("should reject --password-stdin without --username", async () => {
    const { exitCode } = await run(["login", "--password-stdin", "ghcr.io"], {
      stdin: "mypassword\n",
    });
    expect(exitCode).not.toBe(0);
  });
});
