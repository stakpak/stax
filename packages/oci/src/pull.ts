import type { OciManifest } from "./types.ts";
import { getRegistryAuthorizationHeader } from "./auth.ts";
import { parseReference } from "./reference.ts";
import { registryUrl } from "./registry.ts";

export interface PullResult {
  manifest: OciManifest;
  blobs: Map<string, Uint8Array>;
}

async function createHeaders(
  registry: string,
  headers?: Record<string, string>,
): Promise<Record<string, string>> {
  const authorization = await getRegistryAuthorizationHeader(registry);
  return {
    ...headers,
    ...(authorization ? { Authorization: authorization } : {}),
  };
}

async function fetchBlob(
  baseUrl: string,
  registry: string,
  repository: string,
  digest: string,
): Promise<Uint8Array> {
  const res = await fetch(`${baseUrl}/v2/${repository}/blobs/${digest}`, {
    headers: await createHeaders(registry),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch blob ${digest}: ${res.status}`);
  }
  return new Uint8Array(await res.arrayBuffer());
}

export async function pull(reference: string): Promise<PullResult> {
  const ref = parseReference(reference);
  const baseUrl = registryUrl(ref.registry);
  const tagOrDigest = ref.digest ?? ref.tag ?? "latest";

  // 1. Fetch manifest
  const manifestRes = await fetch(`${baseUrl}/v2/${ref.repository}/manifests/${tagOrDigest}`, {
    headers: await createHeaders(ref.registry, {
      Accept: "application/vnd.oci.image.manifest.v1+json",
    }),
  });
  if (!manifestRes.ok) {
    throw new Error(`Failed to pull manifest: ${manifestRes.status}`);
  }
  const manifest = (await manifestRes.json()) as OciManifest;

  // 2. Fetch all blobs (config + layers)
  const blobs = new Map<string, Uint8Array>();

  // Config blob (if size > 0)
  if (manifest.config.size > 0) {
    const blob = await fetchBlob(baseUrl, ref.registry, ref.repository, manifest.config.digest);
    blobs.set(manifest.config.digest, blob);
  }

  // Layer blobs
  for (const layer of manifest.layers) {
    const blob = await fetchBlob(baseUrl, ref.registry, ref.repository, layer.digest);
    blobs.set(layer.digest, blob);
  }

  return { manifest, blobs };
}
