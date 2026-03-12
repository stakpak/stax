import type { AdapterConfig } from "@stax/core";

export interface WindsurfOptions {
  model?: string;
  writeRules?: boolean;
  writeInstructions?: boolean;
}

export default function windsurf(options?: WindsurfOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "windsurf",
    runtime: "windsurf",
    adapterVersion: "1.0.0",
    model: opts.model,
    importMode: "filesystem",
    fidelity: "best-effort",
    config: {},
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "translated",
      skills: "translated",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      toolPermissions: "unsupported",
      modelConfig: "unsupported",
      exactMode: true,
    },
    targets: [
      { kind: "file", path: "AGENTS.md", scope: "project", description: "Instructions" },
      { kind: "directory", path: ".windsurf/rules/", scope: "project", description: "Rules" },
      {
        kind: "directory",
        path: ".windsurf/workflows/",
        scope: "project",
        description: "Workflows/skills",
      },
    ],
  };
}
