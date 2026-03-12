import { describe, expect, it, vi, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import type { OciManifest, OciLayer } from "@stax/oci";

import { resolvePackages } from "./resolve.ts";

const PACKAGES_MEDIA_TYPE = "application/vnd.stax.packages.v1+json";
const CONFIG_MEDIA_TYPE = "application/vnd.stax.config.v1+json";

interface PullResult {
  manifest: OciManifest;
  blobs: Map<string, Uint8Array>;
}

function createMockPullResult(opts: {
  name: string;
  version: string;
  dependencies?: string[];
}): PullResult {
  const blobs = new Map<string, Uint8Array>();
  const layers: OciLayer[] = [];

  // Config layer (name/version)
  const configData = JSON.stringify({
    specVersion: "1.0.0",
    name: opts.name,
    version: opts.version,
    description: "",
    adapter: { type: "agent", runtime: "node", adapterVersion: "1.0.0" },
  });
  const configBlob = new TextEncoder().encode(configData);
  const configDigest = `sha256:${createHash("sha256").update(configBlob).digest("hex")}`;
  blobs.set(configDigest, configBlob);

  const configDescriptor = {
    mediaType: CONFIG_MEDIA_TYPE,
    digest: configDigest,
    size: configBlob.length,
  };

  // Packages layer (dependencies)
  const deps = opts.dependencies ?? [];
  const depsData = JSON.stringify(deps);
  const depsBlob = new TextEncoder().encode(depsData);
  const depsDigest = `sha256:${createHash("sha256").update(depsBlob).digest("hex")}`;
  blobs.set(depsDigest, depsBlob);
  layers.push({
    mediaType: PACKAGES_MEDIA_TYPE,
    digest: depsDigest,
    size: depsBlob.length,
  });

  const manifest: OciManifest = {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType: "application/vnd.stax.package.v1",
    config: configDescriptor,
    layers,
  };

  return { manifest, blobs };
}

// Compute the digest the same way resolve.ts will
async function expectedDigest(pullResult: PullResult): Promise<string> {
  const manifestJson = JSON.stringify(pullResult.manifest);
  const data = new TextEncoder().encode(manifestJson);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  const hex = Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}

// Store mock pull results keyed by reference
const mockRegistry = new Map<string, PullResult>();

vi.mock("@stax/oci", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@stax/oci")>();
  return {
    ...actual,
    pull: vi.fn(async (reference: string) => {
      const result = mockRegistry.get(reference);
      if (!result) {
        throw new Error(`Mock: unknown reference ${reference}`);
      }
      return result;
    }),
  };
});

beforeEach(() => {
  mockRegistry.clear();
});

describe("resolvePackages", () => {
  it("should handle empty references", async () => {
    const result = await resolvePackages([]);
    expect(result.packages).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  describe("single package", () => {
    it("should resolve a single package reference to its real digest", async () => {
      const pullResult = createMockPullResult({ name: "pkg-a", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullResult);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-a:1.0.0");
      expect(result.packages[0]!.digest).toBe(await expectedDigest(pullResult));
    });

    it("should return the package with its transitive dependencies", async () => {
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0"],
      });
      const pullB = createMockPullResult({ name: "pkg-b", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      expect(result.packages).toHaveLength(2);
      // pkg-a should list pkg-b as a dependency
      const pkgA = result.packages.find((p) => p.reference === "ghcr.io/myorg/pkg-a:1.0.0");
      expect(pkgA!.dependencies).toContain("ghcr.io/myorg/pkg-b:1.0.0");
    });
  });

  describe("transitive resolution", () => {
    it("should resolve transitive dependencies depth-first", async () => {
      // A depends on B, B depends on C. Result order: C, B, A
      const pullC = createMockPullResult({ name: "pkg-c", version: "1.0.0" });
      const pullB = createMockPullResult({
        name: "pkg-b",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-c:1.0.0"],
      });
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);
      mockRegistry.set("ghcr.io/myorg/pkg-c:1.0.0", pullC);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      expect(result.packages).toHaveLength(3);
      // Order should be C, B, A (lowest priority first = deepest deps first)
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-c:1.0.0");
      expect(result.packages[1]!.reference).toBe("ghcr.io/myorg/pkg-b:1.0.0");
      expect(result.packages[2]!.reference).toBe("ghcr.io/myorg/pkg-a:1.0.0");
    });

    it("should resolve in declaration order for independent packages", async () => {
      const pullA = createMockPullResult({ name: "pkg-a", version: "1.0.0" });
      const pullB = createMockPullResult({ name: "pkg-b", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);

      const result = await resolvePackages([
        "ghcr.io/myorg/pkg-a:1.0.0",
        "ghcr.io/myorg/pkg-b:1.0.0",
      ]);

      expect(result.packages).toHaveLength(2);
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-a:1.0.0");
      expect(result.packages[1]!.reference).toBe("ghcr.io/myorg/pkg-b:1.0.0");
    });
  });

  describe("deduplication", () => {
    it("should deduplicate same (ref, digest) pair", async () => {
      // A and B both depend on C → C appears once
      const pullC = createMockPullResult({ name: "pkg-c", version: "1.0.0" });
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-c:1.0.0"],
      });
      const pullB = createMockPullResult({
        name: "pkg-b",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-c:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);
      mockRegistry.set("ghcr.io/myorg/pkg-c:1.0.0", pullC);

      const result = await resolvePackages([
        "ghcr.io/myorg/pkg-a:1.0.0",
        "ghcr.io/myorg/pkg-b:1.0.0",
      ]);

      const cEntries = result.packages.filter((p) => p.reference === "ghcr.io/myorg/pkg-c:1.0.0");
      expect(cEntries).toHaveLength(1);
    });

    it("should deduplicate identical direct references", async () => {
      const pullA = createMockPullResult({ name: "pkg-a", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);

      const result = await resolvePackages([
        "ghcr.io/myorg/pkg-a:1.0.0",
        "ghcr.io/myorg/pkg-a:1.0.0",
      ]);

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-a:1.0.0");
    });
  });

  describe("circular detection", () => {
    it("should throw on circular dependency with cycle path in message", async () => {
      // A → B → A
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0"],
      });
      const pullB = createMockPullResult({
        name: "pkg-b",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-a:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);

      await expect(resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"])).rejects.toThrow(
        /Circular dependency detected/,
      );
      await expect(resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"])).rejects.toThrow(
        /pkg-a.*→.*pkg-b.*→.*pkg-a/,
      );
    });

    it("should throw on self-referencing package", async () => {
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-a:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);

      await expect(resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"])).rejects.toThrow(
        /Circular dependency detected/,
      );
    });
  });

  describe("depth limit", () => {
    it("should throw when dependency depth exceeds 32 levels", async () => {
      // Create a chain of 33 packages: chain-0 → chain-1 → ... → chain-32
      for (let i = 0; i <= 32; i++) {
        const deps = i < 32 ? [`ghcr.io/myorg/chain-${i + 1}:1.0.0`] : [];
        const pull = createMockPullResult({
          name: `chain-${i}`,
          version: "1.0.0",
          dependencies: deps,
        });
        mockRegistry.set(`ghcr.io/myorg/chain-${i}:1.0.0`, pull);
      }

      await expect(resolvePackages(["ghcr.io/myorg/chain-0:1.0.0"])).rejects.toThrow(
        /depth exceeds maximum of 32/,
      );
    });

    it("should succeed at exactly 32 levels deep", async () => {
      // Create a chain of 32 packages: chain-0 → chain-1 → ... → chain-31
      for (let i = 0; i <= 31; i++) {
        const deps = i < 31 ? [`ghcr.io/myorg/chain-${i + 1}:1.0.0`] : [];
        const pull = createMockPullResult({
          name: `chain-${i}`,
          version: "1.0.0",
          dependencies: deps,
        });
        mockRegistry.set(`ghcr.io/myorg/chain-${i}:1.0.0`, pull);
      }

      const result = await resolvePackages(["ghcr.io/myorg/chain-0:1.0.0"]);
      expect(result.packages).toHaveLength(32);
    });
  });

  describe("diamond dependency", () => {
    it("should handle diamond when both sides resolve to same digest", async () => {
      // A → B, A → C, B → D, C → D
      const pullD = createMockPullResult({ name: "pkg-d", version: "1.0.0" });
      const pullB = createMockPullResult({
        name: "pkg-b",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-d:1.0.0"],
      });
      const pullC = createMockPullResult({
        name: "pkg-c",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-d:1.0.0"],
      });
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0", "ghcr.io/myorg/pkg-c:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);
      mockRegistry.set("ghcr.io/myorg/pkg-c:1.0.0", pullC);
      mockRegistry.set("ghcr.io/myorg/pkg-d:1.0.0", pullD);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      // D should appear only once
      const dEntries = result.packages.filter((p) => p.reference === "ghcr.io/myorg/pkg-d:1.0.0");
      expect(dEntries).toHaveLength(1);

      // All 4 packages should be present
      expect(result.packages).toHaveLength(4);

      // D should come before B and C, which come before A
      const refs = result.packages.map((p) => p.reference);
      expect(refs.indexOf("ghcr.io/myorg/pkg-d:1.0.0")).toBeLessThan(
        refs.indexOf("ghcr.io/myorg/pkg-b:1.0.0"),
      );
      expect(refs.indexOf("ghcr.io/myorg/pkg-d:1.0.0")).toBeLessThan(
        refs.indexOf("ghcr.io/myorg/pkg-c:1.0.0"),
      );
      expect(refs.indexOf("ghcr.io/myorg/pkg-b:1.0.0")).toBeLessThan(
        refs.indexOf("ghcr.io/myorg/pkg-a:1.0.0"),
      );
    });
  });

  describe("metadata", () => {
    it("should return empty warnings for clean resolution", async () => {
      const pullA = createMockPullResult({ name: "pkg-a", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);
      expect(result.warnings).toEqual([]);
    });

    it("should return packages in priority order (lowest first)", async () => {
      // deps before dependents
      const pullB = createMockPullResult({ name: "pkg-b", version: "1.0.0" });
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      // B (dependency) should come before A (dependent)
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-b:1.0.0");
      expect(result.packages[1]!.reference).toBe("ghcr.io/myorg/pkg-a:1.0.0");
    });

    it("should include dependency references in resolved packages", async () => {
      const pullB = createMockPullResult({ name: "pkg-b", version: "1.0.0" });
      const pullA = createMockPullResult({
        name: "pkg-a",
        version: "1.0.0",
        dependencies: ["ghcr.io/myorg/pkg-b:1.0.0"],
      });
      mockRegistry.set("ghcr.io/myorg/pkg-a:1.0.0", pullA);
      mockRegistry.set("ghcr.io/myorg/pkg-b:1.0.0", pullB);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a:1.0.0"]);

      const pkgA = result.packages.find((p) => p.reference === "ghcr.io/myorg/pkg-a:1.0.0");
      expect(pkgA!.dependencies).toEqual(["ghcr.io/myorg/pkg-b:1.0.0"]);

      const pkgB = result.packages.find((p) => p.reference === "ghcr.io/myorg/pkg-b:1.0.0");
      expect(pkgB!.dependencies).toEqual([]);
    });

    it("should resolve packages with digest references", async () => {
      const pullA = createMockPullResult({ name: "pkg-a", version: "1.0.0" });
      mockRegistry.set("ghcr.io/myorg/pkg-a@sha256:abc123def456", pullA);

      const result = await resolvePackages(["ghcr.io/myorg/pkg-a@sha256:abc123def456"]);

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0]!.reference).toBe("ghcr.io/myorg/pkg-a@sha256:abc123def456");
      expect(result.packages[0]!.digest).toBe(await expectedDigest(pullA));
    });
  });
});
