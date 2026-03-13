import type { AdapterConfig } from "@stax/core";

export interface OpenClawOptions {
  model?: string;
  workspace?: string;
}

export default function openclaw(options?: OpenClawOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "openclaw",
    runtime: "openclaw",
    adapterVersion: "1.0.0",
    model: opts.model,
    importMode: "filesystem",
    fidelity: "byte-exact",
    config: {
      workspace: opts.workspace,
    },
    features: {
      prompt: "native",
      persona: "native",
      rules: "native",
      skills: "native",
      mcp: "unsupported",
      surfaces: "native",
      secrets: "consumer-only",
      subagents: "unsupported",
      instructionTree: "unsupported",
      toolPermissions: "unsupported",
      modelConfig: "unsupported",
      exactMode: true,
    },
    targets: [
      { kind: "file", path: "AGENTS.md", scope: "project", description: "Instructions" },
      { kind: "file", path: "SOUL.md", scope: "project", description: "Persona/soul" },
      { kind: "file", path: "TOOLS.md", scope: "project", description: "Tool guidance" },
      { kind: "file", path: "IDENTITY.md", scope: "project", description: "Identity" },
      { kind: "file", path: "USER.md", scope: "project", description: "User profile" },
      { kind: "file", path: "HEARTBEAT.md", scope: "project", description: "Heartbeat" },
      { kind: "file", path: "BOOTSTRAP.md", scope: "project", description: "Bootstrap" },
      { kind: "directory", path: "skills/", scope: "project", description: "Skills" },
      { kind: "directory", path: "memory/", scope: "project", description: "Memory" },
    ],
  };
}
