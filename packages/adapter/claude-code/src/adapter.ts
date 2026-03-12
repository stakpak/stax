import type { AdapterConfig } from "@stax/core";

export interface ClaudeCodeOptions {
  model?: string;
  modelParams?: Record<string, unknown>;
  scope?: "project" | "user";
  exact?: boolean;
  instructionsFile?: "CLAUDE.md" | ".claude/CLAUDE.md";
  writeSkills?: boolean;
  writeMcp?: boolean;
  writeSettings?: boolean;
  permissions?: {
    allowedTools?: string[];
    denyRules?: string[];
  };
  settings?: Record<string, unknown>;
}

export default function claudeCode(options?: ClaudeCodeOptions): AdapterConfig {
  const opts = options ?? {};
  const scope = opts.scope ?? "project";
  const instructionsFile = opts.instructionsFile ?? "CLAUDE.md";

  const projectTargets = [
    {
      kind: "file" as const,
      path: instructionsFile,
      scope: "project" as const,
      description: "Main instructions",
    },
    {
      kind: "directory" as const,
      path: ".claude/skills/",
      scope: "project" as const,
      description: "Skills directory",
    },
    {
      kind: "file" as const,
      path: ".mcp.json",
      scope: "project" as const,
      description: "MCP configuration",
    },
    {
      kind: "file" as const,
      path: ".claude/settings.json",
      scope: "project" as const,
      description: "Claude settings",
    },
    {
      kind: "directory" as const,
      path: ".claude/agents/",
      scope: "project" as const,
      description: "Subagent definitions",
    },
  ];

  const userTargets = [
    {
      kind: "file" as const,
      path: "~/.claude/CLAUDE.md",
      scope: "user" as const,
      description: "User instructions",
    },
    {
      kind: "directory" as const,
      path: "~/.claude/skills/",
      scope: "user" as const,
      description: "User skills directory",
    },
    {
      kind: "file" as const,
      path: "~/.claude/settings.json",
      scope: "user" as const,
      description: "User settings",
    },
    {
      kind: "file" as const,
      path: "~/.claude.json",
      scope: "user" as const,
      description: "User MCP configuration",
    },
    {
      kind: "directory" as const,
      path: "~/.claude/agents/",
      scope: "user" as const,
      description: "User subagent definitions",
    },
  ];

  return {
    type: "claude-code",
    runtime: "claude-code",
    adapterVersion: "1.0.0",
    model: opts.model,
    modelParams: opts.modelParams,
    importMode: "filesystem",
    fidelity: opts.exact ? "byte-exact" : "best-effort",
    config: {
      scope,
      writeSkills: opts.writeSkills,
      writeMcp: opts.writeMcp,
      writeSettings: opts.writeSettings,
      permissions: opts.permissions,
      settings: opts.settings,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "native",
      skills: "native",
      mcp: "native",
      surfaces: "embedded",
      secrets: "consumer-only",
    },
    targets: scope === "user" ? userTargets : projectTargets,
  };
}
