import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Project-level ──
  {
    path: "AGENTS.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Agent instructions (hierarchical, per-directory override)",
  },
  {
    path: ".agents/skills/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Project skills (SKILL.md in subdirs)",
  },
  {
    path: ".codex/skills/",
    scope: "project" as const,
    kind: "skills" as const,
    description: "Project skills (legacy path)",
  },
  // ── User-level (global) ──
  {
    path: "~/.codex/AGENTS.md",
    scope: "user" as const,
    kind: "prompt" as const,
    description: "Global agent instructions",
  },
  {
    path: "~/.codex/config.toml",
    scope: "user" as const,
    kind: "config" as const,
    description: "Global Codex config (model, approval policy, MCP servers, sandbox)",
  },
  {
    path: "~/.agents/skills/",
    scope: "user" as const,
    kind: "skills" as const,
    description: "User-installed skills",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("codex", SIGNALS, projectDir, options);
}
