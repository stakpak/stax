import { describe, it, expect, vi, afterEach } from "vitest";
import { pull } from "./pull.ts";
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
      size: 3,
    },
    layers: [
      { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa111", size: 5 },
      { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:bbb222", size: 6 },
    ],
  };
}

function createRegistryMock(manifest: OciManifest) {
  const blobData: Record<string, string> = {
    "sha256:cfgcfgcfg": "cfg",
    "sha256:aaa111": "hello",
    "sha256:bbb222": "world!",
  };

  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    const method = init?.method ?? "GET";

    if (method === "GET" && urlStr.includes("/manifests/")) {
      return new Response(JSON.stringify(manifest), {
        status: 200,
        headers: { "Content-Type": "application/vnd.oci.image.manifest.v1+json" },
      });
    }
    if (method === "GET" && urlStr.includes("/blobs/")) {
      for (const [digest, data] of Object.entries(blobData)) {
        if (urlStr.includes(digest)) {
          return new Response(new TextEncoder().encode(data), { status: 200 });
        }
      }
      return new Response(null, { status: 404 });
    }
    return new Response(null, { status: 404 });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pull", () => {
  describe("happy path", () => {
    it("should pull manifest and all blobs from registry", async () => {
      const manifest = makeMockManifest();
      vi.stubGlobal("fetch", createRegistryMock(manifest));

      const result = await pull("registry.io/myrepo:v1.0.0");

      expect(result.manifest).toEqual(manifest);
      // config + 2 layers = 3 blobs
      expect(result.blobs.size).toBe(3);
    });

    it("should return correct manifest structure", async () => {
      const manifest = makeMockManifest();
      vi.stubGlobal("fetch", createRegistryMock(manifest));

      const result = await pull("registry.io/myrepo:v1.0.0");

      expect(result.manifest.schemaVersion).toBe(2);
      expect(result.manifest.mediaType).toBe("application/vnd.oci.image.manifest.v1+json");
      expect(result.manifest.layers).toHaveLength(2);
    });

    it("should return blobs keyed by digest", async () => {
      const manifest = makeMockManifest();
      vi.stubGlobal("fetch", createRegistryMock(manifest));

      const result = await pull("registry.io/myrepo:v1.0.0");

      expect(result.blobs.has("sha256:aaa111")).toBe(true);
      expect(result.blobs.has("sha256:bbb222")).toBe(true);
      expect(result.blobs.has("sha256:cfgcfgcfg")).toBe(true);
    });
  });

  describe("reference resolution", () => {
    it("should resolve tag to manifest via GET /v2/<repo>/manifests/<tag>", async () => {
      const manifest = makeMockManifest();
      const calls: string[] = [];
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        calls.push(urlStr);
        return (createRegistryMock(manifest) as ReturnType<typeof vi.fn>)(url, init);
      });

      vi.stubGlobal("fetch", mockFetch);

      await pull("registry.io/myrepo:v1.0.0");

      const manifestCall = calls.find((c) => c.includes("/manifests/"));
      expect(manifestCall).toContain("/manifests/v1.0.0");
    });

    it("should pull by digest", async () => {
      const manifest = makeMockManifest();
      const calls: string[] = [];
      const digestRef = "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        calls.push(urlStr);
        return (createRegistryMock(manifest) as ReturnType<typeof vi.fn>)(url, init);
      });

      vi.stubGlobal("fetch", mockFetch);

      await pull(`registry.io/myrepo@${digestRef}`);

      const manifestCall = calls.find((c) => c.includes("/manifests/"));
      expect(manifestCall).toContain(`/manifests/${digestRef}`);
    });
  });

  describe("blob handling", () => {
    it("should fetch config blob", async () => {
      const manifest = makeMockManifest();
      vi.stubGlobal("fetch", createRegistryMock(manifest));

      const result = await pull("registry.io/myrepo:v1.0.0");

      const configBlob = result.blobs.get("sha256:cfgcfgcfg");
      expect(configBlob).toBeDefined();
      expect(new TextDecoder().decode(configBlob)).toBe("cfg");
    });

    it("should fetch all layer blobs", async () => {
      const manifest = makeMockManifest();
      vi.stubGlobal("fetch", createRegistryMock(manifest));

      const result = await pull("registry.io/myrepo:v1.0.0");

      expect(new TextDecoder().decode(result.blobs.get("sha256:aaa111"))).toBe("hello");
      expect(new TextDecoder().decode(result.blobs.get("sha256:bbb222"))).toBe("world!");
    });
  });

  describe("error handling", () => {
    it("should throw when manifest not found (404)", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(pull("registry.io/myrepo:v1.0.0")).rejects.toThrow();
    });

    it("should throw when blob not found (404)", async () => {
      const manifest = makeMockManifest();
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";

        if (method === "GET" && urlStr.includes("/manifests/")) {
          return new Response(JSON.stringify(manifest), { status: 200 });
        }
        // All blob fetches fail
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(pull("registry.io/myrepo:v1.0.0")).rejects.toThrow();
    });

    it("should throw on HTTP 401", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(null, { status: 401 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(pull("registry.io/myrepo:v1.0.0")).rejects.toThrow();
    });

    it("should throw on network error", async () => {
      const mockFetch = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(pull("registry.io/myrepo:v1.0.0")).rejects.toThrow("Failed to fetch");
    });
  });
});
