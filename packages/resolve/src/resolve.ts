import { pull, sha256hex } from "@stax/oci";
import type { ResolveResult, ResolvedPackage } from "./types.ts";

const MAX_DEPTH = 32;
const PACKAGES_MEDIA_TYPE = "application/vnd.stax.packages.v1+json";

/**
 * Resolve package references depth-first in declaration order.
 */
export async function resolvePackages(references: string[]): Promise<ResolveResult> {
  if (references.length === 0) {
    return { packages: [], warnings: [] };
  }

  const resolved = new Map<string, ResolvedPackage>(); // keyed by "ref|digest"
  const result: ResolvedPackage[] = [];
  const warnings: string[] = [];

  async function resolve(ref: string, stack: string[], depth: number): Promise<void> {
    // Circular check
    if (stack.includes(ref)) {
      throw new Error(`Circular dependency detected: ${[...stack, ref].join(" → ")}`);
    }

    // Depth check
    if (depth >= MAX_DEPTH) {
      throw new Error("Dependency depth exceeds maximum of 32 levels");
    }

    // Pull the package manifest
    const { manifest, blobs } = await pull(ref);

    // Compute digest from manifest
    const manifestJson = JSON.stringify(manifest);
    const digestHex = await sha256hex(new TextEncoder().encode(manifestJson));
    const digest = `sha256:${digestHex}`;

    // Dedup check
    const key = `${ref}|${digest}`;
    if (resolved.has(key)) return;

    // Find packages layer to get dependencies
    const packagesLayer = manifest.layers.find((l) => l.mediaType === PACKAGES_MEDIA_TYPE);
    const dependencies: string[] = [];

    if (packagesLayer) {
      const blob = blobs.get(packagesLayer.digest);
      if (blob) {
        const depRefs: string[] = JSON.parse(new TextDecoder().decode(blob));
        dependencies.push(...depRefs);

        // Resolve dependencies first (depth-first)
        for (const depRef of depRefs) {
          await resolve(depRef, [...stack, ref], depth + 1);
        }
      }
    }

    const pkg: ResolvedPackage = { reference: ref, digest, dependencies };
    resolved.set(key, pkg);
    result.push(pkg);
  }

  for (const ref of references) {
    await resolve(ref, [], 0);
  }

  return { packages: result, warnings };
}
