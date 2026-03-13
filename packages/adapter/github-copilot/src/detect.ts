import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: ".github/copilot-instructions.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Repo-wide Copilot instructions (always-on)",
  },
  {
    path: ".github/instructions/",
    scope: "project" as const,
    kind: "rules" as const,
    description: "Path-scoped instructions (.instructions.md with applyTo frontmatter)",
  },
  {
    path: ".github/prompts/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Reusable prompt files (.prompt.md slash commands)",
  },
  {
    path: ".github/agents/",
    scope: "project" as const,
    kind: "other" as const,
    description: "Custom agent definitions (.agent.md with tools)",
  },
  {
    path: ".github/skills/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Skills (SKILL.md in subdirs)",
  },
  {
    path: ".vscode/mcp.json",
    scope: "project" as const,
    kind: "mcp" as const,
    description: "VS Code MCP server configuration (servers key)",
  },
  {
    path: "AGENTS.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Agent instructions",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("github-copilot", SIGNALS, projectDir, options);
}
