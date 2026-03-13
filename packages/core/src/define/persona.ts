import type { PersonaDefinition } from "../types.ts";
import { NAME_REGEX } from "../validation.ts";

const VALID_COMMUNICATION_STYLES = ["direct", "diplomatic", "academic", "casual", "formal"];
const VALID_VERBOSITY = ["minimal", "concise", "balanced", "detailed", "verbose"];
const VALID_CODE_COMMENTS = ["none", "minimal", "moderate", "thorough"];

export function definePersona(definition: PersonaDefinition): PersonaDefinition {
  if (!definition.name || !NAME_REGEX.test(definition.name)) {
    throw new Error(`Invalid persona name: "${definition.name}". Must match ${NAME_REGEX}`);
  }
  if (!definition.displayName || definition.displayName.length === 0) {
    throw new Error("Persona displayName is required and must be non-empty");
  }
  if (!definition.role || definition.role.length === 0) {
    throw new Error("Persona role is required and must be non-empty");
  }
  if (
    definition.personality?.communicationStyle &&
    !VALID_COMMUNICATION_STYLES.includes(definition.personality.communicationStyle)
  ) {
    throw new Error(
      `Invalid communicationStyle: "${definition.personality.communicationStyle}". Must be one of: ${VALID_COMMUNICATION_STYLES.join(", ")}`,
    );
  }
  if (
    definition.personality?.verbosity &&
    !VALID_VERBOSITY.includes(definition.personality.verbosity)
  ) {
    throw new Error(
      `Invalid verbosity: "${definition.personality.verbosity}". Must be one of: ${VALID_VERBOSITY.join(", ")}`,
    );
  }
  if (
    definition.voice?.codeComments &&
    !VALID_CODE_COMMENTS.includes(definition.voice.codeComments)
  ) {
    throw new Error(
      `Invalid codeComments: "${definition.voice.codeComments}". Must be one of: ${VALID_CODE_COMMENTS.join(", ")}`,
    );
  }

  return {
    ...definition,
    specVersion: definition.specVersion ?? "1.0.0",
  };
}
