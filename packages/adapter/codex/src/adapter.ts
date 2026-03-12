import type { AdapterConfig } from "@stax/core";

export interface CodexOptions {
  model?: string;
  modelParams?: Record<string, unknown>;
  scope?: "project" | "user";
  exact?: boolean;
  approval?: "untrusted" | "on-request" | "never";
  sandbox?: "read-only" | "workspace-write" | "danger-full-access";
  allowLoginShell?: boolean;
  writeConfig?: boolean;
  writeInstructions?: boolean;
  writeSkills?: boolean;
  writeMcp?: boolean;
}

export default function codex(options?: CodexOptions): AdapterConfig {
  const opts = options ?? {};
  const scope = opts.scope ?? "project";

  const projectTargets = [
    {
      kind: "file" as const,
      path: "AGENTS.md",
      scope: "project" as const,
      description: "Main instructions",
    },
    {
      kind: "file" as const,
      path: ".codex/config.toml",
      scope: "project" as const,
      description: "Codex configuration",
    },
    {
      kind: "directory" as const,
      path: ".agents/skills/",
      scope: "project" as const,
      description: "Skills directory",
    },
  ];

  const userTargets = [
    {
      kind: "file" as const,
      path: "~/.codex/AGENTS.md",
      scope: "user" as const,
      description: "User instructions",
    },
    {
      kind: "file" as const,
      path: "~/.codex/config.toml",
      scope: "user" as const,
      description: "User Codex configuration",
    },
    {
      kind: "directory" as const,
      path: "$HOME/.agents/skills/",
      scope: "user" as const,
      description: "User skills directory",
    },
  ];

  return {
    type: "codex",
    runtime: "codex",
    adapterVersion: "1.0.0",
    model: opts.model,
    modelParams: opts.modelParams,
    importMode: "filesystem",
    fidelity: opts.exact ? "byte-exact" : "best-effort",
    config: {
      scope,
      approval: opts.approval,
      sandbox: opts.sandbox,
      allowLoginShell: opts.allowLoginShell,
      writeConfig: opts.writeConfig,
      writeInstructions: opts.writeInstructions,
      writeSkills: opts.writeSkills,
      writeMcp: opts.writeMcp,
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
    targets: scope === "user" ? userTargets : projectTargets,
  };
}
