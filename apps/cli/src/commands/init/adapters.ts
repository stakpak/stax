import type { DetectionResult } from "@stax/core";
import { detect as detectClaudeCode } from "@stax/claude-code";
import { detect as detectCodex } from "@stax/codex";
import { detect as detectCursor } from "@stax/cursor";
import { detect as detectGithubCopilot } from "@stax/github-copilot";
import { detect as detectOpenclaw } from "@stax/openclaw";
import { detect as detectOpencode } from "@stax/opencode";
import { detect as detectWindsurf } from "@stax/windsurf";

import { KNOWN_ADAPTERS } from "../../command-helpers.ts";

export const INIT_ADAPTERS = [...KNOWN_ADAPTERS].filter((adapter) => adapter !== "generic");

export const ADAPTER_HINTS: Record<string, string> = {
  "claude-code": "Anthropic Claude Code CLI",
  codex: "OpenAI Codex CLI",
  cursor: "Cursor IDE",
  "github-copilot": "GitHub Copilot",
  openclaw: "OpenClaw agent runtime",
  opencode: "OpenCode CLI",
  windsurf: "Windsurf IDE",
};

export type DetectFn = (projectDir: string, options?: { homeDir?: string }) => DetectionResult;

const ADAPTER_DETECTORS: Record<string, DetectFn> = {
  "claude-code": detectClaudeCode,
  codex: detectCodex,
  cursor: detectCursor,
  "github-copilot": detectGithubCopilot,
  openclaw: detectOpenclaw,
  opencode: detectOpencode,
  windsurf: detectWindsurf,
};

export function getAdapterDetect(adapter: string): DetectFn | undefined {
  return ADAPTER_DETECTORS[adapter];
}
