import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { run } from "./helpers.ts";

describe("detectEntry", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "stax-detect-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  // ── build command auto-detection ──

  it("build should find agent.ts inside .stax/[name]/", async () => {
    const agentDir = join(tmp, ".stax", "my-agent");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "agent.ts"), "export default {}");
    const { exitCode, stderr } = await run(["build"], { cwd: tmp });
    // Should attempt to build (may succeed or fail with build error, but NOT "no buildable entry found")
    expect([0, 2]).toContain(exitCode);
    expect(stderr).not.toContain("no buildable stax entry found");
  });

  it("build should find package.ts inside .stax/[name]/", async () => {
    const pkgDir = join(tmp, ".stax", "my-pkg");
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(join(pkgDir, "package.ts"), "export default {}");
    const { stderr } = await run(["build"], { cwd: tmp });
    expect(stderr).not.toContain("no buildable stax entry found");
  });

  it("build should report 'no entry found' when .stax/ is empty", async () => {
    const { exitCode, stderr } = await run(["build"], { cwd: tmp });
    expect(exitCode).toBe(2);
    expect(stderr).toContain("no buildable stax entry found");
  });

  it("build should list multiple agents when more than one found", async () => {
    mkdirSync(join(tmp, ".stax", "agent-a"), { recursive: true });
    writeFileSync(join(tmp, ".stax", "agent-a", "agent.ts"), "export default {}");
    mkdirSync(join(tmp, ".stax", "agent-b"), { recursive: true });
    writeFileSync(join(tmp, ".stax", "agent-b", "agent.ts"), "export default {}");
    // With multiple agents and no explicit entry, should prompt or list
    const { exitCode, stderr } = await run(["build"], { cwd: tmp });
    // Should tell user to specify which one
    expect(exitCode).toBe(2);
    expect(stderr).toContain("agent-a");
    expect(stderr).toContain("agent-b");
  });

  // ── validate command auto-detection ──

  it("validate should find agent.ts inside .stax/[name]/", async () => {
    const agentDir = join(tmp, ".stax", "my-agent");
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(agentDir, "agent.ts"), "export default {}");
    const { stderr } = await run(["validate"], { cwd: tmp });
    expect(stderr).not.toContain("no valid stax definition found");
  });

  it("validate should report 'no definition found' when .stax/ is empty", async () => {
    const { exitCode, stderr } = await run(["validate"], { cwd: tmp });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("no valid stax definition found");
  });

  // ── root-level agent.ts should NOT be found ──

  it("build should NOT find root-level agent.ts", async () => {
    writeFileSync(join(tmp, "agent.ts"), "export default {}");
    const { exitCode, stderr } = await run(["build"], { cwd: tmp });
    expect(exitCode).toBe(2);
    expect(stderr).toContain("no buildable stax entry found");
  });

  it("validate should NOT find root-level agent.ts", async () => {
    writeFileSync(join(tmp, "agent.ts"), "export default {}");
    const { exitCode, stderr } = await run(["validate"], { cwd: tmp });
    expect(exitCode).toBe(1);
    expect(stderr).toContain("no valid stax definition found");
  });
});
