import { describe, expect, it } from "vitest";
import type { OciManifest, OciLayer, OciDescriptor, OciConfig } from "./types.ts";

describe("OCI types", () => {
  it("should define OciManifest with schemaVersion 2", () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      mediaType: "application/vnd.oci.image.manifest.v1+json",
      artifactType: "application/vnd.stax.agent.v1",
      config: {
        mediaType: "application/vnd.stax.config.v1+json",
        digest: "sha256:abc",
        size: 100,
      },
      layers: [],
    };
    expect(manifest.schemaVersion).toBe(2);
  });

  it("should allow optional annotations on manifest", () => {
    const manifest: OciManifest = {
      schemaVersion: 2,
      mediaType: "application/vnd.oci.image.manifest.v1+json",
      artifactType: "application/vnd.stax.agent.v1",
      config: {
        mediaType: "application/vnd.stax.config.v1+json",
        digest: "sha256:abc",
        size: 100,
      },
      layers: [],
      annotations: {
        "org.opencontainers.image.created": "2026-03-12T00:00:00Z",
        "org.opencontainers.image.version": "1.0.0",
        "org.opencontainers.image.title": "my-agent",
        "dev.stax.spec.version": "1.0.0",
        "dev.stax.adapter.type": "claude-code",
        "dev.stax.adapter.runtime": "claude-code",
      },
    };
    expect(manifest.annotations).toBeDefined();
    expect(manifest.annotations!["dev.stax.spec.version"]).toBe("1.0.0");
  });

  it("should allow optional annotations on layers", () => {
    const layer: OciLayer = {
      mediaType: "application/vnd.stax.persona.v1+json",
      digest: "sha256:abc",
      size: 100,
      annotations: {
        "dev.stax.memory.snapshot": "seed",
      },
    };
    expect(layer.annotations).toBeDefined();
  });

  it("should define OciConfig with required fields", () => {
    const config: OciConfig = {
      specVersion: "1.0.0",
      name: "my-agent",
      version: "1.0.0",
      description: "Test agent",
      adapter: {
        type: "claude-code",
        runtime: "claude-code",
        adapterVersion: "1.0.0",
      },
    };
    expect(config.specVersion).toBe("1.0.0");
    expect(config.adapter.type).toBe("claude-code");
  });

  it("should define OciDescriptor with required fields", () => {
    const descriptor: OciDescriptor = {
      mediaType: "application/vnd.stax.config.v1+json",
      digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      size: 256,
    };
    expect(descriptor.mediaType).toBeDefined();
    expect(descriptor.digest).toMatch(/^sha256:/);
    expect(descriptor.size).toBeGreaterThan(0);
  });
});
