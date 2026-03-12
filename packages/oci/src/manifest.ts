import type { OciDescriptor, OciLayer, OciManifest } from "./types.ts";
import { LAYER_MEDIA_TYPES, LAYER_ORDER } from "./constants.ts";

export interface ManifestOptions {
  artifactType: string;
  layers: OciLayer[];
  config: OciDescriptor;
  annotations?: Record<string, string>;
}

export function createManifest(options: ManifestOptions): OciManifest;
export function createManifest(
  artifactType: string,
  layers: OciLayer[],
  config?: OciDescriptor,
  annotations?: Record<string, string>,
): OciManifest;
export function createManifest(
  optionsOrArtifactType: ManifestOptions | string,
  layersArg?: OciLayer[],
  configArg?: OciDescriptor,
  annotationsArg?: Record<string, string>,
): OciManifest {
  let artifactType: string;
  let layers: OciLayer[];
  let config: OciDescriptor;
  let annotations: Record<string, string> | undefined;

  if (typeof optionsOrArtifactType === "string") {
    artifactType = optionsOrArtifactType;
    layers = layersArg ?? [];
    config = configArg ?? {
      mediaType: LAYER_MEDIA_TYPES.config,
      digest: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      size: 0,
    };
    annotations = annotationsArg;
  } else {
    artifactType = optionsOrArtifactType.artifactType;
    layers = optionsOrArtifactType.layers;
    config = optionsOrArtifactType.config;
    annotations = optionsOrArtifactType.annotations;
  }

  // Sort layers according to canonical LAYER_ORDER
  const orderIndex = (mediaType: string): number => {
    const idx = (LAYER_ORDER as readonly string[]).indexOf(mediaType);
    return idx === -1 ? LAYER_ORDER.length : idx;
  };

  const sortedLayers = [...layers].sort(
    (a, b) => orderIndex(a.mediaType) - orderIndex(b.mediaType),
  );

  const manifest: OciManifest = {
    schemaVersion: 2,
    mediaType: "application/vnd.oci.image.manifest.v1+json",
    artifactType,
    config,
    layers: sortedLayers,
  };

  if (annotations && Object.keys(annotations).length > 0) {
    manifest.annotations = annotations;
  }

  return manifest;
}
