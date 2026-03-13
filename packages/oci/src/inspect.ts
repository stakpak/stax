import type { OciManifest } from "./types.ts";
import { getRegistryAuthorizationHeader } from "./auth.ts";
import { parseReference } from "./reference.ts";
import { registryUrl } from "./registry.ts";

export interface InspectResult {
  manifest: OciManifest;
  name: string;
  version: string;
  artifactType: string;
  layers: { mediaType: string; digest: string; size: number }[];
  totalSize: number;
}

export async function inspect(reference: string): Promise<InspectResult> {
  const ref = parseReference(reference);
  const baseUrl = registryUrl(ref.registry);
  const tagOrDigest = ref.digest ?? ref.tag ?? "latest";
  const authorization = await getRegistryAuthorizationHeader(ref.registry);

  const manifestRes = await fetch(`${baseUrl}/v2/${ref.repository}/manifests/${tagOrDigest}`, {
    headers: {
      Accept: "application/vnd.oci.image.manifest.v1+json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
  });
  if (!manifestRes.ok) {
    throw new Error(`Failed to inspect: ${manifestRes.status}`);
  }

  let manifest: OciManifest;
  try {
    manifest = (await manifestRes.json()) as OciManifest;
  } catch {
    throw new Error("Malformed manifest");
  }

  const annotations = manifest.annotations ?? {};
  const name = annotations["org.opencontainers.image.title"] ?? "";
  const version = annotations["org.opencontainers.image.version"] ?? "";
  const layers = manifest.layers.map((l) => ({
    mediaType: l.mediaType,
    digest: l.digest,
    size: l.size,
  }));
  const totalSize = layers.reduce((sum, l) => sum + l.size, 0);

  return { manifest, name, version, artifactType: manifest.artifactType, layers, totalSize };
}
