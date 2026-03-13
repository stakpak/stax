import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: ".cursorrules",
    scope: "project" as const,
    kind: "rules" as const,
    description: "Cursor rules (legacy plain text)",
  },
  {
    path: "AGENTS.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Agent instructions (supports nesting per-directory)",
  },
  {
    path: ".cursor/rules/",
    scope: "project" as const,
    kind: "rules" as const,
    description:
      "Cursor rules directory (.mdc files with description/globs/alwaysApply frontmatter)",
  },
  {
    path: ".cursor/mcp.json",
    scope: "project" as const,
    kind: "mcp" as const,
    description: "Project MCP server configuration",
  },
  {
    path: ".cursor/hooks.json",
    scope: "project" as const,
    kind: "config" as const,
    description: "Lifecycle hooks (preToolUse, postToolUse, sessionStart)",
  },
  // ── User-level (global) ──
  {
    path: "~/.cursor/mcp.json",
    scope: "user" as const,
    kind: "mcp" as const,
    description: "Global MCP server configuration",
  },
  {
    path: "~/.cursor/hooks.json",
    scope: "user" as const,
    kind: "config" as const,
    description: "Global lifecycle hooks",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("cursor", SIGNALS, projectDir, options);
}
