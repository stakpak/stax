import { describe, expect, it } from "vitest";
import { parseReference } from "./reference.ts";

describe("parseReference", () => {
  it("should parse registry/repo:tag", () => {
    const ref = parseReference("ghcr.io/myorg/agents/backend:3.1.0");
    expect(ref.registry).toBe("ghcr.io");
    expect(ref.repository).toBe("myorg/agents/backend");
    expect(ref.tag).toBe("3.1.0");
    expect(ref.digest).toBeUndefined();
  });

  it("should parse registry/repo@digest", () => {
    const ref = parseReference("ghcr.io/myorg/agents/backend@sha256:abc123");
    expect(ref.registry).toBe("ghcr.io");
    expect(ref.repository).toBe("myorg/agents/backend");
    expect(ref.digest).toBe("sha256:abc123");
    expect(ref.tag).toBeUndefined();
  });

  it("should parse registry/repo:tag@digest", () => {
    const ref = parseReference("ghcr.io/myorg/agents/backend:3.1.0@sha256:abc123");
    expect(ref.registry).toBe("ghcr.io");
    expect(ref.tag).toBe("3.1.0");
    expect(ref.digest).toBe("sha256:abc123");
  });

  it("should default registry to docker.io for short names", () => {
    const ref = parseReference("myorg/backend:latest");
    expect(ref.registry).toBe("docker.io");
    expect(ref.repository).toBe("myorg/backend");
    expect(ref.tag).toBe("latest");
  });

  it("should reject empty string", () => {
    expect(() => parseReference("")).toThrow();
  });

  it("should handle port numbers in registry", () => {
    const ref = parseReference("localhost:5000/myorg/agent:1.0.0");
    expect(ref.registry).toBe("localhost:5000");
    expect(ref.repository).toBe("myorg/agent");
    expect(ref.tag).toBe("1.0.0");
  });

  it("should parse simple repo:tag without registry dot", () => {
    const ref = parseReference("library/ubuntu:22.04");
    expect(ref.registry).toBe("docker.io");
    expect(ref.repository).toBe("library/ubuntu");
    expect(ref.tag).toBe("22.04");
  });

  it("should parse digest-only reference", () => {
    const ref = parseReference(
      "ghcr.io/myorg/agent@sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(ref.digest).toBe(
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("should parse deeply nested repository paths", () => {
    const ref = parseReference("ghcr.io/org/team/project/agents/backend:3.1.0");
    expect(ref.registry).toBe("ghcr.io");
    expect(ref.repository).toBe("org/team/project/agents/backend");
    expect(ref.tag).toBe("3.1.0");
  });

  it("should handle registry with subdomain", () => {
    const ref = parseReference("registry.example.com/myorg/agent:1.0.0");
    expect(ref.registry).toBe("registry.example.com");
    expect(ref.repository).toBe("myorg/agent");
  });

  it("should parse tag with semver prerelease", () => {
    const ref = parseReference("ghcr.io/myorg/agent:1.0.0-alpha.1");
    expect(ref.tag).toBe("1.0.0-alpha.1");
  });

  it("should parse latest tag", () => {
    const ref = parseReference("ghcr.io/myorg/agent:latest");
    expect(ref.tag).toBe("latest");
  });

  it("should reject whitespace in reference", () => {
    expect(() => parseReference("ghcr.io/my org/agent:1.0.0")).toThrow();
  });

  it("should handle IPv4 registry address", () => {
    const ref = parseReference("192.168.1.1:5000/myorg/agent:1.0.0");
    expect(ref.registry).toBe("192.168.1.1:5000");
    expect(ref.repository).toBe("myorg/agent");
  });
});
