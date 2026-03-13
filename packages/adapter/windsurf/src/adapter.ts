import type { AdapterConfig } from "@stax/core";

export interface WindsurfOptions {
  model?: string;
  modelParams?: Record<string, unknown>;
  scope?: "project" | "user";
  exact?: boolean;
  writeRules?: boolean;
  writeWorkflows?: boolean;
  writeInstructions?: boolean;
  writeMcp?: boolean;
  legacyWindsurfrules?: boolean;
}

export default function windsurf(options?: WindsurfOptions): AdapterConfig {
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
      kind: "directory" as const,
      path: ".windsurf/rules/",
      scope: "project" as const,
      description: "Rules",
    },
    {
      kind: "directory" as const,
      path: ".windsurf/workflows/",
      scope: "project" as const,
      description: "Workflows/skills",
    },
  ];

  const userTargets = [
    {
      kind: "file" as const,
      path: "~/.codeium/windsurf/memories/global_rules.md",
      scope: "user" as const,
      description: "Global rules",
    },
    {
      kind: "directory" as const,
      path: "~/.codeium/windsurf/global_workflows/",
      scope: "user" as const,
      description: "Global workflows",
    },
    {
      kind: "file" as const,
      path: "~/.codeium/windsurf/mcp_config.json",
      scope: "user" as const,
      description: "MCP configuration",
    },
  ];

  return {
    type: "windsurf",
    runtime: "windsurf",
    adapterVersion: "1.0.0",
    model: opts.model,
    modelParams: opts.modelParams,
    importMode: "filesystem",
    fidelity: opts.exact ? "byte-exact" : "best-effort",
    config: {
      scope,
      writeRules: opts.writeRules,
      writeWorkflows: opts.writeWorkflows,
      writeInstructions: opts.writeInstructions,
      writeMcp: opts.writeMcp,
      legacyWindsurfrules: opts.legacyWindsurfrules,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "translated",
      skills: "translated",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      subagents: "unsupported",
      instructionTree: "unsupported",
      toolPermissions: "unsupported",
      modelConfig: "unsupported",
      exactMode: true,
    },
    targets: scope === "user" ? userTargets : projectTargets,
  };
}
