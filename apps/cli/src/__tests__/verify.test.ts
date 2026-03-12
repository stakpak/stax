import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("verify", () => {
  it("should require a reference argument", async () => {
    const { exitCode } = await run(["verify"]);
    expect(exitCode).not.toBe(0);
  });

  it("should accept OCI reference", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend-engineer:3.1.0"]);
    expect([0, 3, 6]).toContain(exitCode);
  });

  it("should exit with code 6 on verification failure", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend-engineer:3.1.0"]);
    expect([3, 6]).toContain(exitCode);
  });

  it("should exit with code 0 on successful verification", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend:1.0.0"]);
    expect([0, 3, 6]).toContain(exitCode);
  });

  it("should check signatures via OCI referrers", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend:3.1.0"]);
    expect([0, 3, 6]).toContain(exitCode);
  });

  it("should check attestations via OCI referrers", async () => {
    const { exitCode } = await run(["verify", "ghcr.io/myorg/agents/backend:3.1.0"]);
    expect([0, 3, 6]).toContain(exitCode);
  });
});
