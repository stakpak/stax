import type { OciManifest } from "./types.ts";

export async function push(
  _reference: string,
  _manifest: OciManifest,
  _blobs: Map<string, Uint8Array>,
): Promise<string> {
  throw new Error("Not implemented");
}
