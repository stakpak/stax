import type { AdapterConfig } from "@stax/core";

export interface CursorOptions {
  model?: string;
  writeRules?: boolean;
  writeMcp?: boolean;
  writeSkills?: boolean;
}

export default function cursor(options?: CursorOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "cursor",
    runtime: "cursor",
    adapterVersion: "1.0.0",
    model: opts.model,
    importMode: "filesystem",
    fidelity: "best-effort",
    config: {},
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "translated",
      skills: "native",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      toolPermissions: "unsupported",
      modelConfig: "unsupported",
      exactMode: true,
    },
    targets: [
      { kind: "file", path: "AGENTS.md", scope: "project", description: "Instructions" },
      { kind: "directory", path: ".cursor/rules/", scope: "project", description: "Rules" },
      { kind: "file", path: ".cursor/mcp.json", scope: "project", description: "MCP config" },
      { kind: "directory", path: ".cursor/skills/", scope: "project", description: "Skills" },
    ],
  };
}
