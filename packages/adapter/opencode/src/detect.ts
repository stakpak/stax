import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: ".opencode.json",
    scope: "project" as const,
    kind: "config" as const,
    description: "OpenCode project config (providers, MCP, agents, context paths)",
  },
  {
    path: "opencode.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "OpenCode instructions",
  },
  {
    path: "CLAUDE.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Claude instructions (auto-loaded by OpenCode)",
  },
  {
    path: ".opencode/commands/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Custom commands (.md files)",
  },
  // ── User-level (global) ──
  {
    path: "~/.opencode.json",
    scope: "user" as const,
    kind: "config" as const,
    description: "Global OpenCode config (providers, MCP servers)",
  },
  {
    path: "~/.config/opencode/.opencode.json",
    scope: "user" as const,
    kind: "config" as const,
    description: "Global OpenCode config (XDG path)",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("opencode", SIGNALS, projectDir, options);
}
