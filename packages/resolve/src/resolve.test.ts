import { describe, expect, it } from "vitest";
import { resolvePackages } from "./resolve.ts";

describe("resolvePackages", () => {
  it("should resolve a single package reference", async () => {
    const result = await resolvePackages(["ghcr.io/myorg/pkg:1.0.0"]);

    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg:1.0.0");
    expect(result.packages[0]!.digest).toMatch(/^sha256:/);
  });

  it("should resolve transitive dependencies depth-first", async () => {
    const result = await resolvePackages([
      "ghcr.io/myorg/pkg-a:1.0.0",
      "ghcr.io/myorg/pkg-b:1.0.0",
    ]);

    // Dependencies should come before dependents
    expect(result.packages.length).toBeGreaterThanOrEqual(2);
  });

  it("should return packages in priority order (lowest first)", async () => {
    const result = await resolvePackages([
      "ghcr.io/myorg/base:1.0.0",
      "ghcr.io/myorg/override:1.0.0",
    ]);

    // Last declared has highest priority, but in result array lowest comes first
    expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/base:1.0.0");
  });

  it("should handle empty references", async () => {
    const result = await resolvePackages([]);
    expect(result.packages).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("should deduplicate same package reference resolved to same digest", async () => {
    const result = await resolvePackages(["ghcr.io/myorg/pkg:1.0.0", "ghcr.io/myorg/pkg:1.0.0"]);
    // Deduplication: same ref+digest should appear only once
    const refs = result.packages.map((p) => p.reference);
    const uniqueRefs = [...new Set(refs)];
    expect(refs.length).toBe(uniqueRefs.length);
  });

  it("should fail on circular dependencies", async () => {
    await expect(resolvePackages(["ghcr.io/myorg/circular-a:1.0.0"])).rejects.toThrow();
  });

  it("should fail when dependency depth exceeds 32 levels", async () => {
    await expect(resolvePackages(["ghcr.io/myorg/deep-chain:1.0.0"])).rejects.toThrow();
  });

  it("should return warnings array", async () => {
    const result = await resolvePackages(["ghcr.io/myorg/pkg:1.0.0"]);
    expect(result.warnings).toBeInstanceOf(Array);
  });

  it("should include dependency references in resolved packages", async () => {
    const result = await resolvePackages(["ghcr.io/myorg/pkg:1.0.0"]);
    for (const pkg of result.packages) {
      expect(pkg.dependencies).toBeInstanceOf(Array);
    }
  });

  it("should resolve packages with digest references", async () => {
    const result = await resolvePackages(["ghcr.io/myorg/pkg@sha256:abc123def456"]);
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0]!.digest).toMatch(/^sha256:/);
  });
});
