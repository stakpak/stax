import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { detect } from "../detect.ts";

describe("cursor detect", () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), "stax-detect-cursor-"));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it("should return found: false when no config exists", () => {
    const fakeHome = mkdtempSync(join(tmpdir(), "stax-fakehome-"));
    const result = detect(tmp, { homeDir: fakeHome });
    expect(result.found).toBe(false);
    rmSync(fakeHome, { recursive: true, force: true });
  });

  it("should detect .cursorrules file", () => {
    writeFileSync(join(tmp, ".cursorrules"), "Be concise.");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".cursorrules", scope: "project", kind: "rules" }),
    );
  });

  it("should detect .cursor/rules/ directory", () => {
    mkdirSync(join(tmp, ".cursor", "rules"), { recursive: true });
    writeFileSync(join(tmp, ".cursor", "rules", "test.mdc"), "rule");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".cursor/rules/", scope: "project", kind: "rules" }),
    );
  });

  it("should detect .cursor/mcp.json", () => {
    mkdirSync(join(tmp, ".cursor"), { recursive: true });
    writeFileSync(join(tmp, ".cursor", "mcp.json"), "{}");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: ".cursor/mcp.json", scope: "project", kind: "mcp" }),
    );
  });

  it("should detect AGENTS.md", () => {
    writeFileSync(join(tmp, "AGENTS.md"), "# Agent");
    const result = detect(tmp);
    expect(result.found).toBe(true);
    expect(result.files).toContainEqual(
      expect.objectContaining({ targetPath: "AGENTS.md", scope: "project", kind: "prompt" }),
    );
  });

  it("should set adapter to cursor", () => {
    writeFileSync(join(tmp, ".cursorrules"), "rules");
    const result = detect(tmp);
    expect(result.adapter).toBe("cursor");
  });
});
