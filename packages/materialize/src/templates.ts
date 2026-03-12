import type { PersonaDefinition } from "@stax/core";

/**
 * Render {{persona.*}} template expressions in prompt text.
 */
export function renderPromptTemplates(
  template: string,
  context: { persona?: PersonaDefinition },
): string {
  if (!context.persona) return template;

  // Handle escaped expressions: replace \{{ with a placeholder
  const ESCAPE_PLACEHOLDER = "\x00ESCAPED_OPEN\x00";
  let result = template.replace(/\\{{/g, ESCAPE_PLACEHOLDER);

  // Replace all {{...}} expressions
  result = result.replace(/\{\{([^}]+)\}\}/g, (_match, expr: string) => {
    const path = expr.trim();

    // Only persona.* is supported
    if (!path.startsWith("persona.")) {
      return "";
    }

    const parts = path.slice("persona.".length).split(".");
    let value: unknown = context.persona;

    for (const part of parts) {
      if (value == null || typeof value !== "object") {
        return "";
      }
      value = (value as Record<string, unknown>)[part];
    }

    if (value == null) return "";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  });

  // Restore escaped expressions
  result = result.replaceAll(ESCAPE_PLACEHOLDER, "{{");

  return result;
}
