import type { SubagentsDefinition } from "../types.ts";
import { NAME_REGEX } from "../validation.ts";

export function defineSubagents(definition: SubagentsDefinition): SubagentsDefinition {
  if (!definition.agents || Object.keys(definition.agents).length === 0) {
    throw new Error("Subagents agents must not be empty");
  }

  for (const [name, agent] of Object.entries(definition.agents)) {
    if (!NAME_REGEX.test(name)) {
      throw new Error(`Invalid subagent name: "${name}". Must match ${NAME_REGEX}`);
    }
    if (!agent.description || agent.description.length === 0) {
      throw new Error(`Subagent "${name}": description is required and must be non-empty`);
    }
    if (!agent.instructions || agent.instructions.length === 0) {
      throw new Error(`Subagent "${name}": instructions path is required and must be non-empty`);
    }
  }

  return {
    ...definition,
    specVersion: definition.specVersion ?? "1.0.0",
  };
}
