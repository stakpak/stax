import { describe, expect, it, afterEach } from "vitest";
import { createLockfile, readLockfile } from "./lockfile.ts";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

describe("readLockfile", () => {
  let tempDir: string;

  afterEach(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should read a valid lockfile from disk", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "stax-lockfile-"));
    const lockfilePath = join(tempDir, "stax-lock.json");
    const lockfileData = {
      lockVersion: 1,
      specVersion: "1.0.0",
      packages: {
        "ghcr.io/myorg/pkg:1.0.0": {
          digest: "sha256:abc123",
          dependencies: ["ghcr.io/myorg/dep:1.0.0"],
        },
        "ghcr.io/myorg/dep:1.0.0": {
          digest: "sha256:def456",
          dependencies: [],
        },
      },
    };
    await writeFile(lockfilePath, JSON.stringify(lockfileData), "utf-8");

    const lockfile = await readLockfile(lockfilePath);

    expect(lockfile.lockVersion).toBe(1);
    expect(lockfile.specVersion).toBe("1.0.0");
    expect(lockfile.packages["ghcr.io/myorg/pkg:1.0.0"]!.digest).toBe("sha256:abc123");
    expect(lockfile.packages["ghcr.io/myorg/pkg:1.0.0"]!.dependencies).toEqual([
      "ghcr.io/myorg/dep:1.0.0",
    ]);
    expect(lockfile.packages["ghcr.io/myorg/dep:1.0.0"]!.digest).toBe("sha256:def456");
  });

  it("should throw on malformed lockfile JSON", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "stax-lockfile-"));
    const lockfilePath = join(tempDir, "stax-lock.json");
    await writeFile(lockfilePath, "not valid json {{{", "utf-8");

    await expect(readLockfile(lockfilePath)).rejects.toThrow(/Malformed lockfile JSON/);
  });

  it("should throw on lockfile with wrong lockVersion", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "stax-lockfile-"));
    const lockfilePath = join(tempDir, "stax-lock.json");
    const lockfileData = {
      lockVersion: 2,
      specVersion: "1.0.0",
      packages: {},
    };
    await writeFile(lockfilePath, JSON.stringify(lockfileData), "utf-8");

    await expect(readLockfile(lockfilePath)).rejects.toThrow(/Invalid lockVersion/);
  });

  it("should throw when lockfile path does not exist", async () => {
    await expect(readLockfile("/nonexistent/path/stax-lock.json")).rejects.toThrow(
      /Lockfile not found/,
    );
  });

  it("should return empty packages when lockfile has no entries", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "stax-lockfile-"));
    const lockfilePath = join(tempDir, "stax-lock.json");
    const lockfileData = {
      lockVersion: 1,
      specVersion: "1.0.0",
      packages: {},
    };
    await writeFile(lockfilePath, JSON.stringify(lockfileData), "utf-8");

    const lockfile = await readLockfile(lockfilePath);

    expect(lockfile.lockVersion).toBe(1);
    expect(Object.keys(lockfile.packages)).toHaveLength(0);
  });
});
