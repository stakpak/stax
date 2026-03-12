import { describe, expect, it } from "vitest";
import { createLockfile } from "./lockfile.ts";

describe("createLockfile", () => {
  it("should create a lockfile with version 1", () => {
    const lockfile = createLockfile({
      packages: [{ reference: "ghcr.io/myorg/pkg:1.0.0", digest: "sha256:abc", dependencies: [] }],
    });

    expect(lockfile.lockVersion).toBe(1);
    expect(lockfile.specVersion).toBe("1.0.0");
  });

  it("should include package entries keyed by reference", () => {
    const lockfile = createLockfile({
      packages: [
        {
          reference: "ghcr.io/myorg/pkg:1.0.0",
          digest: "sha256:abc",
          dependencies: ["ghcr.io/myorg/dep:1.0.0"],
        },
      ],
    });

    const entry = lockfile.packages["ghcr.io/myorg/pkg:1.0.0"];
    expect(entry).toBeDefined();
    expect(entry!.digest).toBe("sha256:abc");
    expect(entry!.dependencies).toContain("ghcr.io/myorg/dep:1.0.0");
  });

  it("should set specVersion to 1.0.0", () => {
    const lockfile = createLockfile({
      packages: [{ reference: "ghcr.io/myorg/pkg:1.0.0", digest: "sha256:abc", dependencies: [] }],
    });
    expect(lockfile.specVersion).toBe("1.0.0");
  });

  it("should handle multiple packages", () => {
    const lockfile = createLockfile({
      packages: [
        { reference: "ghcr.io/myorg/pkg-a:1.0.0", digest: "sha256:aaa", dependencies: [] },
        {
          reference: "ghcr.io/myorg/pkg-b:2.0.0",
          digest: "sha256:bbb",
          dependencies: ["ghcr.io/myorg/pkg-a:1.0.0"],
        },
      ],
    });

    expect(Object.keys(lockfile.packages)).toHaveLength(2);
    expect(lockfile.packages["ghcr.io/myorg/pkg-b:2.0.0"]!.dependencies).toContain(
      "ghcr.io/myorg/pkg-a:1.0.0",
    );
  });

  it("should handle empty packages list", () => {
    const lockfile = createLockfile({ packages: [] });
    expect(lockfile.lockVersion).toBe(1);
    expect(Object.keys(lockfile.packages)).toHaveLength(0);
  });

  it("should preserve digest format", () => {
    const lockfile = createLockfile({
      packages: [
        {
          reference: "ghcr.io/myorg/pkg:1.0.0",
          digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          dependencies: [],
        },
      ],
    });
    expect(lockfile.packages["ghcr.io/myorg/pkg:1.0.0"]!.digest).toMatch(/^sha256:/);
  });
});
