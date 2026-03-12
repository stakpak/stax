import type { OciManifest } from "./types.ts";

export interface PullResult {
  manifest: OciManifest;
  blobs: Map<string, Uint8Array>;
}

export async function pull(_reference: string): Promise<PullResult> {
  throw new Error("Not implemented");
}
