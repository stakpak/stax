import type { PackageDefinition } from "../types.ts";

const NAME_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

export function definePackage(definition: PackageDefinition): PackageDefinition {
  if (!definition.name || !NAME_REGEX.test(definition.name)) {
    throw new Error(`Invalid package name: "${definition.name}". Must match ${NAME_REGEX}`);
  }
  if (!definition.version || !SEMVER_REGEX.test(definition.version)) {
    throw new Error(`Invalid version: "${definition.version}". Must be valid semver`);
  }
  if (!definition.description || definition.description.length === 0) {
    throw new Error("Package description is required and must be non-empty");
  }
  if (definition.tags) {
    if (new Set(definition.tags).size !== definition.tags.length) {
      throw new Error("Tags must contain unique values");
    }
  }

  return {
    ...definition,
    specVersion: definition.specVersion ?? "1.0.0",
  };
}
