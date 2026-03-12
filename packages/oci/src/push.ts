import type { OciManifest } from "./types.ts";
import { parseReference } from "./reference.ts";
import { registryUrl, sha256hex } from "./registry.ts";

export async function push(
  reference: string,
  manifest: OciManifest,
  blobs: Map<string, Uint8Array>,
): Promise<string> {
  const ref = parseReference(reference);
  const baseUrl = registryUrl(ref.registry);

  // 1. For each blob, check if exists, upload if not
  for (const [digest, data] of blobs) {
    const headRes = await fetch(`${baseUrl}/v2/${ref.repository}/blobs/${digest}`, {
      method: "HEAD",
    });
    if (headRes.ok) continue;

    // Initiate upload
    const postRes = await fetch(`${baseUrl}/v2/${ref.repository}/blobs/uploads/`, {
      method: "POST",
    });
    if (!postRes.ok) {
      throw new Error(`Failed to initiate blob upload: ${postRes.status}`);
    }

    const location = postRes.headers.get("Location");
    if (!location) {
      throw new Error("Missing Location header in upload response");
    }

    // Complete upload
    const separator = location.includes("?") ? "&" : "?";
    const putRes = await fetch(`${location}${separator}digest=${digest}`, {
      method: "PUT",
      body: data,
      headers: { "Content-Type": "application/octet-stream" },
    });
    if (!putRes.ok) {
      throw new Error(`Failed to upload blob: ${putRes.status}`);
    }
  }

  // 2. Push manifest
  const manifestJson = JSON.stringify(manifest);
  const manifestBytes = new TextEncoder().encode(manifestJson);
  const hash = await sha256hex(manifestBytes);
  const manifestDigest = `sha256:${hash}`;
  const tagOrDigest = ref.tag ?? ref.digest ?? manifestDigest;

  const putRes = await fetch(`${baseUrl}/v2/${ref.repository}/manifests/${tagOrDigest}`, {
    method: "PUT",
    body: manifestBytes,
    headers: { "Content-Type": "application/vnd.oci.image.manifest.v1+json" },
  });
  if (!putRes.ok) {
    throw new Error(`Failed to push manifest: ${putRes.status}`);
  }

  return manifestDigest;
}
