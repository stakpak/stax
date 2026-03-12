import type { AdapterConfig } from "@stax/core";

export interface GitHubCopilotOptions {
  model?: string;
  modelParams?: Record<string, unknown>;
  writeInstructions?: boolean;
  writePathInstructions?: boolean;
  writeMcp?: boolean;
  writeSkills?: boolean;
  writeAgentsMd?: boolean;
  writeAgents?: boolean;
}

export default function githubCopilot(options?: GitHubCopilotOptions): AdapterConfig {
  const opts = options ?? {};
  return {
    type: "github-copilot",
    runtime: "github-copilot",
    adapterVersion: "1.0.0",
    model: opts.model,
    modelParams: opts.modelParams,
    importMode: "filesystem",
    fidelity: "best-effort",
    config: {
      writeInstructions: opts.writeInstructions,
      writePathInstructions: opts.writePathInstructions,
      writeMcp: opts.writeMcp,
      writeSkills: opts.writeSkills,
      writeAgentsMd: opts.writeAgentsMd,
      writeAgents: opts.writeAgents,
    },
    features: {
      prompt: "native",
      persona: "embedded",
      rules: "translated",
      skills: "native",
      mcp: "translated",
      surfaces: "embedded",
      secrets: "consumer-only",
      toolPermissions: "unsupported",
      modelConfig: "native",
      exactMode: true,
    },
    targets: [
      {
        kind: "file",
        path: ".github/copilot-instructions.md",
        scope: "workspace",
        description: "Repo-wide instructions",
      },
      {
        kind: "directory",
        path: ".github/instructions/",
        scope: "workspace",
        description: "Path-scoped instructions",
      },
      { kind: "file", path: ".vscode/mcp.json", scope: "workspace", description: "MCP config" },
      { kind: "directory", path: ".github/skills/", scope: "workspace", description: "Skills" },
      { kind: "file", path: "AGENTS.md", scope: "workspace", description: "Root instructions" },
      {
        kind: "directory",
        path: ".github/agents/",
        scope: "workspace",
        description: "Agent definitions",
      },
    ],
  };
}
