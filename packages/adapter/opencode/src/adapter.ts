import type { AdapterConfig } from "@stax/core";

export interface OpenCodeOptions {
  model?: string;
  agent?: {
    build?: { model?: string };
  };
}

export default function opencode(options?: OpenCodeOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "opencode",
    runtime: "opencode",
    adapterVersion: "1.0.0",
    model: opts.model,
    importMode: "filesystem",
    fidelity: "best-effort",
    config: {
      agent: opts.agent,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "embedded",
      skills: "native",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      toolPermissions: "translated",
      modelConfig: "native",
      exactMode: true,
    },
    targets: [
      { kind: "file", path: "AGENTS.md", scope: "project", description: "Instructions" },
      { kind: "file", path: "opencode.jsonc", scope: "project", description: "OpenCode config" },
      { kind: "directory", path: ".opencode/skill/", scope: "project", description: "Skills" },
      { kind: "directory", path: ".opencode/command/", scope: "project", description: "Commands" },
    ],
  };
}
