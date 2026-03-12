import { describe, it, expect, vi, afterEach } from "vitest";
import { push } from "./push.ts";
import { createManifest } from "./manifest.ts";
import { ARTIFACT_TYPE_AGENT, LAYER_MEDIA_TYPES } from "./constants.ts";
import type { OciManifest } from "./types.ts";

function makeManifest(): OciManifest {
  return createManifest(ARTIFACT_TYPE_AGENT, [
    { mediaType: LAYER_MEDIA_TYPES.persona, digest: "sha256:aaa111", size: 5 },
    { mediaType: LAYER_MEDIA_TYPES.prompt, digest: "sha256:bbb222", size: 6 },
  ]);
}

function makeBlobs(): Map<string, Uint8Array> {
  const blobs = new Map<string, Uint8Array>();
  blobs.set("sha256:aaa111", new TextEncoder().encode("hello"));
  blobs.set("sha256:bbb222", new TextEncoder().encode("world!"));
  return blobs;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("push", () => {
  describe("happy path", () => {
    it("should push blobs then manifest to registry", async () => {
      const calls: { url: string; method: string }[] = [];

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";
        calls.push({ url: urlStr, method });

        // HEAD blob check -> 404 (not found)
        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 404 });
        }
        // POST initiate upload
        if (method === "POST" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, {
            status: 202,
            headers: { Location: `${urlStr}?upload=1` },
          });
        }
        // PUT blob upload
        if (method === "PUT" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, { status: 201 });
        }
        // PUT manifest
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const manifest = makeManifest();
      const blobs = makeBlobs();

      await push("registry.io/myrepo:v1.0.0", manifest, blobs);

      // Should have HEAD, POST, PUT for each blob (2 blobs) then PUT manifest
      const headCalls = calls.filter((c) => c.method === "HEAD");
      const postCalls = calls.filter((c) => c.method === "POST");
      const putBlobCalls = calls.filter((c) => c.method === "PUT" && c.url.includes("/blobs/"));
      const putManifestCalls = calls.filter(
        (c) => c.method === "PUT" && c.url.includes("/manifests/"),
      );

      expect(headCalls).toHaveLength(2);
      expect(postCalls).toHaveLength(2);
      expect(putBlobCalls).toHaveLength(2);
      expect(putManifestCalls).toHaveLength(1);
    });

    it("should return the manifest digest after successful push", async () => {
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 404 });
        }
        if (method === "POST" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, {
            status: 202,
            headers: { Location: `${urlStr}?upload=1` },
          });
        }
        if (method === "PUT" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, { status: 201 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      const result = await push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs());

      expect(result).toMatch(/^sha256:[a-f0-9]{64}$/);
    });

    it("should skip blob upload when registry already has it (HEAD 200)", async () => {
      const calls: { url: string; method: string }[] = [];

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";
        calls.push({ url: urlStr, method });

        // HEAD blob check -> 200 (already exists)
        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 200 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs());

      const postCalls = calls.filter((c) => c.method === "POST");
      const putBlobCalls = calls.filter((c) => c.method === "PUT" && c.url.includes("/blobs/"));

      expect(postCalls).toHaveLength(0);
      expect(putBlobCalls).toHaveLength(0);
    });

    it("should push manifest with correct content-type header", async () => {
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 200 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          const headers = new Headers(init?.headers);
          expect(headers.get("Content-Type")).toBe("application/vnd.oci.image.manifest.v1+json");
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs());
    });
  });

  describe("error handling", () => {
    it("should throw on HTTP 401 from registry", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(null, { status: 401 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs()),
      ).rejects.toThrow();
    });

    it("should throw on HTTP 500 from registry", async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(null, { status: 500 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs()),
      ).rejects.toThrow();
    });

    it("should throw on network error", async () => {
      const mockFetch = vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs())).rejects.toThrow(
        "Failed to fetch",
      );
    });

    it("should throw when blob upload fails", async () => {
      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 404 });
        }
        if (method === "POST" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, {
            status: 202,
            headers: { Location: `${urlStr}?upload=1` },
          });
        }
        // PUT blob -> 500
        if (method === "PUT" && urlStr.includes("/blobs/uploads/")) {
          return new Response(null, { status: 500 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await expect(
        push("registry.io/myrepo:v1.0.0", makeManifest(), makeBlobs()),
      ).rejects.toThrow();
    });
  });

  describe("reference handling", () => {
    it("should push to correct registry URL based on parsed reference", async () => {
      const calls: string[] = [];

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";
        calls.push(urlStr);

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 200 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await push("myregistry.example.com/myrepo:v1.0.0", makeManifest(), makeBlobs());

      expect(calls.every((c) => c.startsWith("https://myregistry.example.com/"))).toBe(true);
    });

    it("should handle tag-based references", async () => {
      const calls: string[] = [];

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";
        calls.push(urlStr);

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 200 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await push("registry.io/repo:v1.0.0", makeManifest(), makeBlobs());

      const manifestPut = calls.find((c) => c.includes("/manifests/"));
      expect(manifestPut).toContain("/manifests/v1.0.0");
    });

    it("should handle digest-based references", async () => {
      const calls: string[] = [];
      const digestRef = "sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

      const mockFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = typeof url === "string" ? url : url.toString();
        const method = init?.method ?? "GET";
        calls.push(urlStr);

        if (method === "HEAD" && urlStr.includes("/blobs/")) {
          return new Response(null, { status: 200 });
        }
        if (method === "PUT" && urlStr.includes("/manifests/")) {
          return new Response(null, { status: 201 });
        }
        return new Response(null, { status: 404 });
      });

      vi.stubGlobal("fetch", mockFetch);

      await push(`registry.io/repo@${digestRef}`, makeManifest(), makeBlobs());

      const manifestPut = calls.find((c) => c.includes("/manifests/"));
      expect(manifestPut).toContain(`/manifests/${digestRef}`);
    });
  });
});
