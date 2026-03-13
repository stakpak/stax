import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: "AGENTS.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Agent instructions (auto-scoped per directory)",
  },
  {
    path: ".windsurf/rules/",
    scope: "project" as const,
    kind: "rules" as const,
    description: "Windsurf rules (.md with trigger/globs frontmatter)",
  },
  {
    path: ".windsurf/workflows/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Windsurf workflows",
  },
  {
    path: ".windsurf/skills/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Windsurf skills (SKILL.md in subdirs)",
  },
  // ── User-level (global) ──
  {
    path: "~/.codeium/windsurf/memories/global_rules.md",
    scope: "user" as const,
    kind: "rules" as const,
    description: "Global rules (6K char limit)",
  },
  {
    path: "~/.codeium/windsurf/global_workflows/",
    scope: "user" as const,
    kind: "skills" as const,
    description: "Global workflows",
  },
  {
    path: "~/.codeium/windsurf/skills/",
    scope: "user" as const,
    kind: "skills" as const,
    description: "Global skills",
  },
  {
    path: "~/.codeium/windsurf/mcp_config.json",
    scope: "user" as const,
    kind: "mcp" as const,
    description: "Global MCP configuration",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("windsurf", SIGNALS, projectDir, options);
}
