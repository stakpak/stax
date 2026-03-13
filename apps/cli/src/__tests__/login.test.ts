import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("login", () => {
  it("should require --username", async () => {
    const { exitCode } = await run(["login", "ghcr.io"]);
    expect(exitCode).toBe(1);
  });

  it("should require password with --username", async () => {
    const { exitCode } = await run(["login", "--username", "testuser", "ghcr.io"]);
    expect(exitCode).toBe(1);
  });

  it("should accept --password-stdin flag", async () => {
    const { exitCode } = await run(
      ["login", "--username", "testuser", "--password-stdin", "ghcr.io"],
      { stdin: "testpassword\n" },
    );
    expect(exitCode).toBe(0);
  });

  it("should require --username when no flags given", async () => {
    const { exitCode } = await run(["login"]);
    expect(exitCode).toBe(1);
  });

  it("should require --username for registry with port", async () => {
    const { exitCode } = await run(["login", "localhost:5000"]);
    expect(exitCode).toBe(1);
  });

  it("should succeed with valid credentials via stdin", async () => {
    const { exitCode } = await run(
      ["login", "--username", "testuser", "--password-stdin", "ghcr.io"],
      { stdin: "mypassword\n" },
    );
    expect(exitCode).toBe(0);
  });

  it("should reject --password-stdin without --username", async () => {
    const { exitCode } = await run(["login", "--password-stdin", "ghcr.io"], {
      stdin: "mypassword\n",
    });
    expect(exitCode).not.toBe(0);
  });
});
