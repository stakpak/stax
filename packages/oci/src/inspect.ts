import type { OciManifest } from "./types.ts";

export interface InspectResult {
  manifest: OciManifest;
  name: string;
  version: string;
  artifactType: string;
  layers: { mediaType: string; digest: string; size: number }[];
  totalSize: number;
}

export async function inspect(_reference: string): Promise<InspectResult> {
  throw new Error("Not implemented");
}
