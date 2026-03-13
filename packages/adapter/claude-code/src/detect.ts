import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: "CLAUDE.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Main instructions",
  },
  {
    path: ".claude/CLAUDE.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Main instructions (nested)",
  },
  {
    path: ".mcp.json",
    scope: "project" as const,
    kind: "mcp" as const,
    description: "Project MCP server configuration",
  },
  {
    path: ".claude/settings.json",
    scope: "project" as const,
    kind: "config" as const,
    description: "Project settings (permissions, env, hooks)",
  },
  {
    path: ".claude/settings.local.json",
    scope: "project" as const,
    kind: "config" as const,
    description: "Local project settings (machine-specific)",
  },
  {
    path: ".claude/rules/",
    scope: "project" as const,
    kind: "rules" as const,
    description: "Project rules directory",
  },
  {
    path: ".claude/skills/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Project skills directory",
  },
  {
    path: ".claude/commands/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Project commands (legacy skills)",
  },
  {
    path: ".claude/agents/",
    scope: "project" as const,
    kind: "other" as const,
    description: "Subagent definitions",
  },
  // ── User-level (global) ──
  {
    path: "~/.claude/CLAUDE.md",
    scope: "user" as const,
    kind: "prompt" as const,
    description: "Global instructions",
  },
  {
    path: "~/.claude/settings.json",
    scope: "user" as const,
    kind: "config" as const,
    description: "Global settings (permissions, env)",
  },
  {
    path: "~/.claude.json",
    scope: "user" as const,
    kind: "config" as const,
    description:
      "Global config (contains MCP servers alongside sensitive data — whitelist on import)",
  },
  {
    path: "~/.claude/rules/",
    scope: "user" as const,
    kind: "rules" as const,
    description: "Global rules directory",
  },
  {
    path: "~/.claude/skills/",
    scope: "user" as const,
    kind: "skills" as const,
    description: "Global skills directory",
  },
  {
    path: "~/.claude/agents/",
    scope: "user" as const,
    kind: "other" as const,
    description: "Global subagent definitions",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("claude-code", SIGNALS, projectDir, options);
}
