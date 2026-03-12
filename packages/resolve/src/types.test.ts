import { describe, expect, it } from "vitest";
import type { ResolveResult, ResolvedPackage, Lockfile, MergeResult } from "./types.ts";

describe("resolve types", () => {
  it("should define ResolveResult with packages and warnings", () => {
    const result: ResolveResult = {
      packages: [{ reference: "pkg:1.0.0", digest: "sha256:abc", dependencies: [] }],
      warnings: [],
    };
    expect(result.packages).toHaveLength(1);
    expect(result.warnings).toEqual([]);
  });

  it("should define ResolvedPackage with all fields", () => {
    const pkg: ResolvedPackage = {
      reference: "ghcr.io/myorg/pkg:1.0.0",
      digest: "sha256:abc",
      dependencies: ["ghcr.io/myorg/dep:1.0.0"],
    };
    expect(pkg.reference).toBeDefined();
    expect(pkg.digest).toMatch(/^sha256:/);
  });

  it("should define Lockfile with lockVersion 1", () => {
    const lockfile: Lockfile = {
      lockVersion: 1,
      specVersion: "1.0.0",
      packages: {
        "ghcr.io/myorg/pkg:1.0.0": {
          digest: "sha256:abc",
          dependencies: [],
        },
      },
    };
    expect(lockfile.lockVersion).toBe(1);
  });

  it("should define MergeResult with all optional layers", () => {
    const result: MergeResult = {
      mcp: { servers: {} },
      skills: [],
      rules: [],
      knowledge: [],
      surfaces: [],
      secrets: [],
      warnings: [],
    };
    expect(result.warnings).toEqual([]);
  });

  it("should allow MergeResult with partial layers", () => {
    const result: MergeResult = {
      warnings: ["some warning"],
    };
    expect(result.mcp).toBeUndefined();
    expect(result.warnings).toHaveLength(1);
  });
});
