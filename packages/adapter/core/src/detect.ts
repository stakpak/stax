import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { DetectedFile, DetectionResult, MaterializationTarget } from "@stax/core";

export interface DetectSignal {
  /** Relative path to check (from project root for project scope, from home for user scope) */
  path: string;
  /** Scope of the signal */
  scope: "project" | "user";
  /** What kind of content this represents */
  kind: DetectedFile["kind"];
  /** Human-readable description */
  description: string;
}

export interface DetectOptions {
  /** Override home directory for testing */
  homeDir?: string;
}

/**
 * Shared detection logic for adapters.
 * Given an adapter name and its signals, scans the filesystem for matches.
 */
export function detectAdapter(
  adapterName: string,
  signals: DetectSignal[],
  projectDir: string,
  options?: DetectOptions,
): DetectionResult {
  const home = options?.homeDir ?? homedir();
  const files: DetectedFile[] = [];

  for (const signal of signals) {
    const baseDir = signal.scope === "user" ? home : projectDir;
    const cleanPath = signal.path.replace(/^~\//, "");
    const absPath = join(baseDir, cleanPath);

    if (existsSync(absPath)) {
      files.push({
        path: absPath,
        targetPath: signal.path,
        kind: signal.kind,
        scope: signal.scope,
        description: signal.description,
      });
    }
  }

  return {
    adapter: adapterName,
    files,
    found: files.length > 0,
  };
}

/**
 * Convert adapter MaterializationTargets into detect signals.
 * Infers the "kind" from the target's description and path.
 */
export function targetsToSignals(targets: MaterializationTarget[]): DetectSignal[] {
  return targets.map((t) => ({
    path: t.path,
    scope: (t.scope === "user" ? "user" : "project") as "project" | "user",
    kind: inferKind(t),
    description: t.description ?? t.path,
  }));
}

function inferKind(target: MaterializationTarget): DetectedFile["kind"] {
  const p = target.path.toLowerCase();
  const d = (target.description ?? "").toLowerCase();

  if (d.includes("mcp") || p.includes("mcp")) return "mcp";
  if (d.includes("skill") || p.includes("skill")) return "skills";
  if (d.includes("rule") || p.includes("rule")) return "rules";
  if (d.includes("instruction") || d.includes("prompt") || p.endsWith(".md")) return "prompt";
  if (
    d.includes("setting") ||
    d.includes("config") ||
    p.includes("config") ||
    p.includes("settings")
  )
    return "config";
  return "other";
}

// ── Shared standard signals ──
// Common patterns used across multiple adapters. Individual adapters can
// append these to their own signals or use them as a base.

/** Standard signals shared by adapters that use AGENTS.md */
export const SHARED_AGENTS_MD: DetectSignal = {
  path: "AGENTS.md",
  scope: "project",
  kind: "prompt",
  description: "Instructions (AGENTS.md)",
};

/** Standard signals for .mcp.json at project root */
export const SHARED_MCP_JSON: DetectSignal = {
  path: ".mcp.json",
  scope: "project",
  kind: "mcp",
  description: "MCP configuration",
};

/** Standard signals for .vscode/mcp.json */
export const SHARED_VSCODE_MCP: DetectSignal = {
  path: ".vscode/mcp.json",
  scope: "project",
  kind: "mcp",
  description: "VS Code MCP configuration",
};
