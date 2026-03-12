import { describe, expect, it } from "vitest";
import { createManifest } from "./manifest.ts";
import { ARTIFACT_TYPE_AGENT, ARTIFACT_TYPE_PACKAGE, LAYER_MEDIA_TYPES } from "./constants.ts";

describe("createManifest", () => {
  it("should create a valid OCI manifest", () => {
    const layers = [
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:bbb", size: 200 },
    ];

    const manifest = createManifest(ARTIFACT_TYPE_AGENT, layers);

    expect(manifest.schemaVersion).toBe(2);
    expect(manifest.artifactType).toBe(ARTIFACT_TYPE_AGENT);
    expect(manifest.layers).toHaveLength(2);
  });

  it("should include config descriptor", () => {
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, []);
    expect(manifest.config).toBeDefined();
    expect(manifest.config.mediaType).toBe("application/vnd.stax.config.v1+json");
  });

  it("should order layers according to LAYER_ORDER", () => {
    const layers = [
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.knowledge, digest: "sha256:bbb", size: 200 },
      { mediaType: LAYER_MEDIA_TYPES.rules, digest: "sha256:ccc", size: 300 },
    ];

    const manifest = createManifest(ARTIFACT_TYPE_AGENT, layers);

    const mediaTypes = manifest.layers.map((l) => l.mediaType);
    expect(mediaTypes.indexOf(LAYER_MEDIA_TYPES.knowledge)).toBeLessThan(
      mediaTypes.indexOf(LAYER_MEDIA_TYPES.rules),
    );
    expect(mediaTypes.indexOf(LAYER_MEDIA_TYPES.rules)).toBeLessThan(
      mediaTypes.indexOf(LAYER_MEDIA_TYPES.persona),
    );
  });

  it("should set mediaType to OCI manifest", () => {
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, []);
    expect(manifest.mediaType).toBe("application/vnd.oci.image.manifest.v1+json");
  });

  it("should set schemaVersion to 2 always", () => {
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, []);
    expect(manifest.schemaVersion).toBe(2);
  });

  it("should accept package artifact type", () => {
    const manifest = createManifest(ARTIFACT_TYPE_PACKAGE, []);
    expect(manifest.artifactType).toBe(ARTIFACT_TYPE_PACKAGE);
  });

  it("should preserve all layers in output", () => {
    const layers = [
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:bbb", size: 200 },
      { mediaType: LAYER_MEDIA_TYPES.mcp, digest: "sha256:ccc", size: 300 },
    ];
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, layers);
    expect(manifest.layers).toHaveLength(3);
  });

  it("should preserve layer digests and sizes", () => {
    const layers = [{ mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa111", size: 512 }];
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, layers);
    expect(manifest.layers[0]!.digest).toBe("sha256:aaa111");
    expect(manifest.layers[0]!.size).toBe(512);
  });

  it("should handle all 12 canonical layer types", () => {
    const layers = [
      { mediaType: LAYER_MEDIA_TYPES.knowledge, digest: "sha256:01", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.rules, digest: "sha256:02", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.skills, digest: "sha256:03", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.mcp, digest: "sha256:04", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.secrets, digest: "sha256:05", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.packages, digest: "sha256:06", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.instructionTree, digest: "sha256:07", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.surfaces, digest: "sha256:08", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:09", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:10", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.subagents, digest: "sha256:11", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.memory, digest: "sha256:12", size: 100 },
    ];
    const manifest = createManifest(ARTIFACT_TYPE_AGENT, layers);
    expect(manifest.layers).toHaveLength(12);
  });
});
