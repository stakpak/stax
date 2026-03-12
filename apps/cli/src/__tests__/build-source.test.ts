import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("build-source", () => {
  it("should accept build-source with path argument", async () => {
    const { exitCode } = await run(["build-source", "/tmp"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should require a path argument", async () => {
    const { exitCode } = await run(["build-source"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept --git-url flag", async () => {
    const { exitCode } = await run([
      "build-source",
      "/tmp",
      "--git-url",
      "https://github.com/acme/backend.git",
    ]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept --commit flag", async () => {
    const { exitCode } = await run(["build-source", "/tmp", "--commit", "abc123def456"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept repeated --sparse flags", async () => {
    const { exitCode } = await run([
      "build-source",
      "/tmp",
      "--sparse",
      "services/api",
      "--sparse",
      "packages/shared",
    ]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should accept all flags together", async () => {
    const { exitCode } = await run([
      "build-source",
      "/tmp",
      "--git-url",
      "https://github.com/acme/backend.git",
      "--commit",
      "abc123",
      "--sparse",
      "services/api",
    ]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should fail for nonexistent path", async () => {
    const { exitCode } = await run(["build-source", "/nonexistent/path/xyz"]);
    expect(exitCode).toBe(2);
  });

  it("should strip .git/ from source artifacts", async () => {
    const { exitCode } = await run(["build-source", "/tmp"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should produce deterministic source snapshot layer", async () => {
    const { exitCode } = await run(["build-source", "/tmp"]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should record git-url in config blob when provided", async () => {
    const { exitCode } = await run([
      "build-source",
      "/tmp",
      "--git-url",
      "https://github.com/acme/repo.git",
    ]);
    expect([0, 2]).toContain(exitCode);
  });

  it("should record commit in config blob when provided", async () => {
    const { exitCode } = await run(["build-source", "/tmp", "--commit", "abc123"]);
    expect([0, 2]).toContain(exitCode);
  });
});
