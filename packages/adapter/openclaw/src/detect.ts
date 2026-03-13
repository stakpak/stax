import type { DetectionResult } from "@stax/core";
import { detectAdapter, type DetectOptions } from "@stax/adapter-core";

const SIGNALS = [
  // ── Workspace-level (default: ~/.openclaw/workspace/) ──
  // OpenClaw loads these markdown files into the system prompt in order.
  {
    path: "AGENTS.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Operational guidelines and safety defaults",
  },
  {
    path: "SOUL.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Personality and behavioral framework",
  },
  {
    path: "TOOLS.md",
    scope: "project" as const,
    kind: "config" as const,
    description: "Environment-specific local notes (devices, SSH hosts)",
  },
  {
    path: "IDENTITY.md",
    scope: "project" as const,
    kind: "prompt" as const,
    description: "Agent self-definition (name, avatar, tone)",
  },
  {
    path: "USER.md",
    scope: "project" as const,
    kind: "config" as const,
    description: "User profile and preferences",
  },
  {
    path: "HEARTBEAT.md",
    scope: "project" as const,
    kind: "config" as const,
    description: "Heartbeat / periodic check-in config",
  },
  {
    path: "BOOTSTRAP.md",
    scope: "project" as const,
    kind: "config" as const,
    description: "New workspace bootstrap instructions",
  },
  {
    path: "MEMORY.md",
    scope: "project" as const,
    kind: "other" as const,
    description: "Persistent memory (grows over time)",
  },
  // ── User-level (global) ──
  {
    path: "~/.openclaw/openclaw.json",
    scope: "user" as const,
    kind: "config" as const,
    description: "Primary config (JSON5 — agents, channels, hooks, skills, secrets)",
  },
  {
    path: "~/.openclaw/skills/",
    scope: "user" as const,
    kind: "skills" as const,
    description: "Shared skills (available to all agents)",
  },
];

export function detect(projectDir: string, options?: DetectOptions): DetectionResult {
  return detectAdapter("openclaw", SIGNALS, projectDir, options);
}
