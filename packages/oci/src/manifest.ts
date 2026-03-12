import type { OciLayer, OciManifest } from "./types.ts";
import { LAYER_MEDIA_TYPES, LAYER_ORDER } from "./constants.ts";

export function createManifest(artifactType: string, layers: OciLayer[]): OciManifest {
  // Sort layers according to canonical LAYER_ORDER
  const orderIndex = (mediaType: string): number => {
    const idx = (LAYER_ORDER as readonly string[]).indexOf(mediaType);
    return idx === -1 ? LAYER_ORDER.length : idx;
  };

  const sortedLayers = [...layers].sort(
    (a, b) => orderIndex(a.mediaType) - orderIndex(b.mediaType),
  );

  return {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType,
    config: {
      mediaType: LAYER_MEDIA_TYPES.config,
      digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      size: 0,
    },
    layers: sortedLayers,
  };
}
