import { describe, it, expect, vi, afterEach } from "vitest";
import { inspect } from "./inspect.ts";
import type { OciManifest } from "./types.ts";
import { ARTIFACT_TYPE_AGENT, LAYER_MEDIA_TYPES } from "./constants.ts";

function makeMockManifest(): OciManifest {
  return {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType: ARTIFACT_TYPE_AGENT,
    config: {
      mediaType: LAYER_MEDIA_TYPES.config,
      digest: "sha256:cfgcfgcfg",
      size: 0,
    },
    layers: [
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa111", size: 100 },
      { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:bbb222", size: 250 },
    ],
    annotations: {
      "org.opencontainers.image.title": "my-agent",
      "org.opencontainers.image.version": "1.2.3",
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("inspect", () => {
  describe("happy path", () => {
    it("should return InspectResult with manifest, name, version, artifactType", async () => {
      const manifest = makeMockManifest();
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify(manifest), {
          status: 200,
          headers: { "Content-Type": "application/vnd.oci.image.manifest.v1+json" },
        });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await inspect("registry.io/myrepo:v1.0.0");

      expect(result.manifest).toEqual(manifest);
      expect(result.name).toBe("my-agent");
      expect(result.version).toBe("1.2.3");
      expect(result.artifactType).toBe(ARTIFACT_TYPE_AGENT);
    });

    it("should return layers array with mediaType, digest, size", async () => {
      const manifest = makeMockManifest();
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify(manifest), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await inspect("registry.io/myrepo:v1.0.0");

      expect(result.layers).toHaveLength(2);
      expect(result.layers[0]).toEqual({
        mediaType: LAYER_MEDIA_TYPES.persona,
        digest: "sha256:aaa111",
        size: 100,
      });
      expect(result.layers[1]).toEqual({
        mediaType: LAYER_MEDIA_TYPES.prompt,
        digest: "sha256:bbb222",
        size: 250,
      });
    });

    it("should compute totalSize as sum of all layer sizes", async () => {
      const manifest = makeMockManifest();
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify(manifest), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await inspect("registry.io/myrepo:v1.0.0");

      expect(result.totalSize).toBe(350); // 100 + 250
    });
  });

  describe("annotation extraction", () => {
    it("should read name from org.opencontainers.image.title annotation", async () => {
      const manifest = makeMockManifest();
      manifest.annotations = { "org.opencontainers.image.title": "custom-name" };
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify(manifest), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await inspect("registry.io/myrepo:v1.0.0");
      expect(result.name).toBe("custom-name");
    });

    it("should read version from org.opencontainers.image.version annotation", async () => {
      const manifest = makeMockManifest();
      manifest.annotations = { "org.opencontainers.image.version": "9.8.7" };
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify(manifest), { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await inspect("registry.io/myrepo:v1.0.0");
      expect(result.version).toBe("9.8.7");
    });
  });

  describe("error handling", () => {
    it("should throw when reference not found", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(inspect("registry.io/myrepo:v1.0.0")).rejects.toThrow();
    });

    it("should throw when manifest is malformed", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response("not valid json{{{", { status: 200 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(inspect("registry.io/myrepo:v1.0.0")).rejects.toThrow();
    });
  });
});
