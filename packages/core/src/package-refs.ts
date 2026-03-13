import type { PackageReference } from "./types.ts";

export interface PackageLayerEntry {
  ref: string;
  digest?: string;
  kind?: string;
}

export interface PackageLayerPayload {
  specVersion?: string;
  packages: PackageLayerEntry[];
}

export function createPackageLayerPayload(
  specVersion: string,
  references: PackageReference[],
): PackageLayerPayload {
  return {
    specVersion,
    packages: references.map((reference) => ({ ref: reference, kind: "package" })),
  };
}

export function decodePackageLayerReferences(payload: unknown): string[] {
  if (Array.isArray(payload)) {
    return payload.filter((value): value is string => typeof value === "string");
  }

  if (typeof payload === "object" && payload !== null && "packages" in payload) {
    const packages = (payload as { packages?: unknown }).packages;
    if (!Array.isArray(packages)) {
      throw new Error("Invalid packages layer: expected an array of package entries");
    }

    return packages.flatMap((entry) => {
      if (typeof entry === "string") {
        return [entry];
      }

      if (
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { ref?: unknown }).ref === "string"
      ) {
        return [(entry as { ref: string }).ref];
      }

      throw new Error("Invalid packages layer: every package entry must be a string or { ref }");
    });
  }

  throw new Error("Invalid packages layer payload");
}
