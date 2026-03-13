import type { AdapterConfig } from "@stax/core";

export interface OpenCodeOptions {
  model?: string;
  modelParams?: Record<string, unknown>;
  scope?: "project" | "user";
  exact?: boolean;
  writeConfig?: boolean;
  writeInstructions?: boolean;
  writeMcp?: boolean;
  writeCommands?: boolean;
  writeSkills?: boolean;
  writeAgents?: boolean;
  agent?: {
    build?: { model?: string };
    plan?: { model?: string };
    [name: string]:
      | { model?: string; description?: string; mode?: "primary" | "subagent" | "all" }
      | undefined;
  };
  permission?: {
    edit?: "allow" | "deny" | "ask";
    bash?: "allow" | "deny" | "ask";
    mcp?: "allow" | "deny" | "ask";
  };
}

export default function opencode(options?: OpenCodeOptions): AdapterConfig {
  const opts = options ?? {};
  const scope = opts.scope ?? "project";

  const projectTargets = [
    {
      kind: "file" as const,
      path: "AGENTS.md",
      scope: "project" as const,
      description: "Instructions",
    },
    {
      kind: "file" as const,
      path: "opencode.jsonc",
      scope: "project" as const,
      description: "OpenCode config",
    },
    {
      kind: "directory" as const,
      path: ".opencode/skill/",
      scope: "project" as const,
      description: "Skills",
    },
    {
      kind: "directory" as const,
      path: ".opencode/command/",
      scope: "project" as const,
      description: "Commands",
    },
    {
      kind: "directory" as const,
      path: ".opencode/agent/",
      scope: "project" as const,
      description: "Agent definitions",
    },
  ];

  const userTargets = [
    {
      kind: "file" as const,
      path: "~/.config/opencode/AGENTS.md",
      scope: "user" as const,
      description: "User instructions",
    },
    {
      kind: "file" as const,
      path: "~/.config/opencode/opencode.jsonc",
      scope: "user" as const,
      description: "User config",
    },
    {
      kind: "directory" as const,
      path: "~/.opencode/skill/",
      scope: "user" as const,
      description: "User skills",
    },
    {
      kind: "directory" as const,
      path: "~/.opencode/command/",
      scope: "user" as const,
      description: "User commands",
    },
    {
      kind: "directory" as const,
      path: "~/.opencode/agent/",
      scope: "user" as const,
      description: "User agent definitions",
    },
  ];

  return {
    type: "opencode",
    runtime: "opencode",
    adapterVersion: "1.0.0",
    model: opts.model,
    modelParams: opts.modelParams,
    importMode: "filesystem",
    fidelity: opts.exact ? "byte-exact" : "best-effort",
    config: {
      scope,
      agent: opts.agent,
      permission: opts.permission,
      writeConfig: opts.writeConfig,
      writeInstructions: opts.writeInstructions,
      writeMcp: opts.writeMcp,
      writeCommands: opts.writeCommands,
      writeSkills: opts.writeSkills,
      writeAgents: opts.writeAgents,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "embedded",
      skills: "native",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      subagents: "native",
      instructionTree: "translated",
      toolPermissions: "translated",
      modelConfig: "native",
      exactMode: true,
    },
    targets: scope === "user" ? userTargets : projectTargets,
  };
}
