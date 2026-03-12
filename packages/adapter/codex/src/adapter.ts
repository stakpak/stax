import type { AdapterConfig } from "@stax/core";

export interface CodexOptions {
  model?: string;
  approval?: "suggest" | "auto-edit" | "on-request";
  sandbox?: "workspace-write" | "workspace-read" | "none";
}

export default function codex(options?: CodexOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "codex",
    runtime: "codex",
    adapterVersion: "1.0.0",
    model: opts.model,
    importMode: "filesystem",
    fidelity: "best-effort",
    config: {
      approval: opts.approval,
      sandbox: opts.sandbox,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "native",
      skills: "native",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
    },
    targets: [
      { kind: "file", path: "AGENTS.md", scope: "project", description: "Main instructions" },
      {
        kind: "file",
        path: ".codex/config.toml",
        scope: "project",
        description: "Codex configuration",
      },
      {
        kind: "directory",
        path: ".agents/skills/",
        scope: "project",
        description: "Skills directory",
      },
    ],
  };
}
