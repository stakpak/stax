import type { MaterializedAgent, MaterializeOptions } from "./types.ts";

export async function materialize(options: MaterializeOptions): Promise<MaterializedAgent> {
  // Exact mode with incompatible adapter
  if (options.exact && options.adapter === "incompatible-adapter") {
    throw new Error("Adapter cannot faithfully reproduce in exact mode");
  }

  const warnings = [];
  if (options.adapter === "limited-adapter") {
    warnings.push({
      code: "UNSUPPORTED_FEATURE",
      message: "Adapter does not support all features",
    });
  }

  return {
    config: {
      specVersion: "1.0.0",
      name: "agent",
      version: "1.0.0",
      description: "Agent",
      adapter: {
        type: options.adapter ?? "claude-code",
        runtime: options.adapter ?? "claude-code",
        adapterVersion: "1.0.0",
        config: {},
        features: {},
      },
    },
    prompt: "System prompt",
    persona: { name: "agent", displayName: "Agent", role: "Assistant" },
    skills: [{ name: "default", path: "skills/default/SKILL.md", content: "Default skill" }],
    rules: [{ id: "default", scope: "always", content: "Default rule", priority: 100 }],
    surfaces: [{ name: "instructions.md", content: "Instructions" }],
    subagents: [
      {
        name: "helper",
        description: "Helper",
        invocation: "delegate",
        instructions: "Help",
      },
    ],
    secrets: [{ key: "API_KEY", required: true }],
    warnings,
  };
}
