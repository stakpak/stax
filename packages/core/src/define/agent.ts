import type { AgentDefinition } from "../types.ts";
import { NAME_REGEX, SEMVER_REGEX } from "../validation.ts";

export function defineAgent(definition: AgentDefinition): AgentDefinition {
  if (!definition.name || !NAME_REGEX.test(definition.name)) {
    throw new Error(`Invalid agent name: "${definition.name}". Must match ${NAME_REGEX}`);
  }
  if (!definition.version || !SEMVER_REGEX.test(definition.version)) {
    throw new Error(`Invalid version: "${definition.version}". Must be valid semver`);
  }
  if (!definition.description || definition.description.length === 0) {
    throw new Error("Agent description is required and must be non-empty");
  }
  if (!definition.adapter) {
    throw new Error("Agent adapter is required");
  }
  if (definition.tags) {
    if (new Set(definition.tags).size !== definition.tags.length) {
      throw new Error("Tags must contain unique values");
    }
  }
  if (definition.workspaceSources) {
    const ids = definition.workspaceSources.map((s) => s.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error("Workspace source IDs must be unique");
    }
    const mountPaths = definition.workspaceSources.map((s) => s.mountPath);
    if (new Set(mountPaths).size !== mountPaths.length) {
      throw new Error("Workspace source mount paths must not collide");
    }
  }

  return {
    ...definition,
    specVersion: definition.specVersion ?? "1.0.0",
  };
}
