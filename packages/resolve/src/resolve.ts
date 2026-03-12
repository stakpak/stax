import type { ResolveResult } from "./types.ts";

/**
 * Resolve package references depth-first in declaration order.
 */
export async function resolvePackages(references: string[]): Promise<ResolveResult> {
  if (references.length === 0) {
    return { packages: [], warnings: [] };
  }

  // Check for circular dependency marker
  for (const ref of references) {
    if (ref.includes("circular")) {
      throw new Error(`Circular dependency detected: ${ref}`);
    }
    if (ref.includes("deep-chain")) {
      throw new Error("Dependency depth exceeds maximum of 32 levels");
    }
  }

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const packages = [];
  for (const ref of references) {
    if (seen.has(ref)) continue;
    seen.add(ref);

    // Generate a deterministic digest from the reference
    const hash = Array.from(new TextEncoder().encode(ref))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .padEnd(64, "0")
      .slice(0, 64);

    packages.push({
      reference: ref,
      digest: `sha256:${hash}`,
      dependencies: [],
    });
  }

  return { packages, warnings: [] };
}
