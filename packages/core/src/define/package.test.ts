import { describe, expect, it } from "vitest";
import { definePackage } from "./package.ts";

describe("definePackage", () => {
  it("should return the package definition when valid", () => {
    const def = definePackage({
      name: "github-workflow",
      version: "2.0.0",
      description: "GitHub workflow package",
    });

    expect(def.name).toBe("github-workflow");
    expect(def.version).toBe("2.0.0");
  });

  it("should default specVersion to 1.0.0", () => {
    const def = definePackage({
      name: "test-pkg",
      version: "1.0.0",
      description: "Test",
    });

    expect(def.specVersion).toBe("1.0.0");
  });

  it("should reject invalid name format", () => {
    expect(() =>
      definePackage({
        name: "INVALID",
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should reject invalid semver", () => {
    expect(() =>
      definePackage({
        name: "test-pkg",
        version: "bad",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should accept layer paths", () => {
    const def = definePackage({
      name: "full-pkg",
      version: "1.0.0",
      description: "Full package",
      mcp: "./mcp.ts",
      skills: "./skills/",
      rules: "./rules/",
      knowledge: "./knowledge/",
      surfaces: "./surfaces/",
      secrets: "./secrets.ts",
    });

    expect(def.mcp).toBe("./mcp.ts");
  });

  it("should accept transitive package references", () => {
    const def = definePackage({
      name: "meta-pkg",
      version: "1.0.0",
      description: "Meta package",
      packages: ["ghcr.io/myorg/packages/base:1.0.0"],
    });

    expect(def.packages).toHaveLength(1);
  });

  it("should reject names with spaces", () => {
    expect(() =>
      definePackage({
        name: "my package",
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should reject names with dots", () => {
    expect(() =>
      definePackage({
        name: "my.package",
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should reject empty description", () => {
    expect(() =>
      definePackage({
        name: "test-pkg",
        version: "1.0.0",
        description: "",
      }),
    ).toThrow();
  });

  it("should reject missing required fields", () => {
    expect(() => definePackage({} as any)).toThrow();
  });

  it("should accept single character name", () => {
    const def = definePackage({
      name: "a",
      version: "1.0.0",
      description: "Test",
    });
    expect(def.name).toBe("a");
  });

  it("should accept 63 character name", () => {
    const def = definePackage({
      name: "a".repeat(63),
      version: "1.0.0",
      description: "Test",
    });
    expect(def.name).toBe("a".repeat(63));
  });

  it("should reject name longer than 63 characters", () => {
    expect(() =>
      definePackage({
        name: "a".repeat(64),
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should reject names ending with hyphen", () => {
    expect(() =>
      definePackage({
        name: "bad-",
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should reject names starting with hyphen", () => {
    expect(() =>
      definePackage({
        name: "-bad",
        version: "1.0.0",
        description: "Test",
      }),
    ).toThrow();
  });

  it("should accept prerelease semver", () => {
    const def = definePackage({
      name: "test-pkg",
      version: "1.0.0-beta.1",
      description: "Test",
    });
    expect(def.version).toBe("1.0.0-beta.1");
  });

  it("should accept tags as unique strings", () => {
    const def = definePackage({
      name: "test-pkg",
      version: "1.0.0",
      description: "Test",
      tags: ["workflow", "github"],
    });
    expect(def.tags).toEqual(["workflow", "github"]);
  });

  it("should reject duplicate tags", () => {
    expect(() =>
      definePackage({
        name: "test-pkg",
        version: "1.0.0",
        description: "Test",
        tags: ["workflow", "workflow"],
      }),
    ).toThrow();
  });

  it("should accept author and license", () => {
    const def = definePackage({
      name: "test-pkg",
      version: "1.0.0",
      description: "Test",
      author: "stakpak",
      license: "MIT",
    });
    expect(def.author).toBe("stakpak");
    expect(def.license).toBe("MIT");
  });

  it("should accept multiple package references", () => {
    const def = definePackage({
      name: "meta-pkg",
      version: "1.0.0",
      description: "Meta package",
      packages: [
        "ghcr.io/myorg/packages/base:1.0.0",
        "ghcr.io/myorg/packages/extras:2.0.0",
        "./local-overrides",
      ],
    });
    expect(def.packages).toHaveLength(3);
  });
});
