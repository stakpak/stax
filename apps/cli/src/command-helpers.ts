import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import type { CommandModule, CommandResult, ParsedArgs, ParsedFlags } from "./command-types.ts";

export const VERSION = "0.0.1";

export const KNOWN_TEMPLATES = new Set(["github-workflow"]);
export const KNOWN_ADAPTERS = new Set([
  "claude-code",
  "codex",
  "cursor",
  "generic",
  "github-copilot",
  "openclaw",
  "opencode",
  "windsurf",
]);

export function parseArgs(args: string[], command: CommandModule): ParsedArgs {
  const valueFlags = new Set(command.valueFlags ?? []);
  const repeatableFlags = new Set(command.repeatableValueFlags ?? []);
  const flags: ParsedFlags = {};
  const positionals: string[] = [];

  let stopParsingFlags = false;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index]!;

    if (stopParsingFlags) {
      positionals.push(token);
      continue;
    }

    if (token === "--") {
      stopParsingFlags = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      flags.help = true;
      continue;
    }

    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const trimmed = token.slice(2);
    const equalsIndex = trimmed.indexOf("=");
    const name = equalsIndex === -1 ? trimmed : trimmed.slice(0, equalsIndex);
    const inlineValue = equalsIndex === -1 ? undefined : trimmed.slice(equalsIndex + 1);

    if (valueFlags.has(name)) {
      const value = inlineValue ?? args[index + 1];
      if (value === undefined) {
        flags[name] = "";
        continue;
      }

      if (inlineValue === undefined) {
        index += 1;
      }

      if (repeatableFlags.has(name)) {
        const current = flags[name];
        if (Array.isArray(current)) {
          current.push(value);
        } else {
          flags[name] = [value];
        }
      } else {
        flags[name] = value;
      }

      continue;
    }

    flags[name] = inlineValue ?? true;
  }

  return { flags, positionals };
}

export function getStringFlag(parsed: ParsedArgs, name: string): string | undefined {
  const value = parsed.flags[name];
  return typeof value === "string" ? value : undefined;
}

export function hasFlag(parsed: ParsedArgs, name: string): boolean {
  return parsed.flags[name] !== undefined;
}

export function renderRootHelp(commands: readonly CommandModule[]): string {
  const lines = ["stax - Stakpak CLI", "", "Usage: stax <command>", "", "Commands:"];

  for (const command of commands) {
    lines.push(`  ${command.name.padEnd(13, " ")} ${command.summary}`);
  }

  return lines.join("\n");
}

export function renderCommandHelp(command: CommandModule): string {
  return [`stax ${command.name}`, "", command.summary, "", `Usage: ${command.usage}`].join("\n");
}

export function getUnknownFlags(parsed: ParsedArgs, command: CommandModule): string[] {
  const allowed = new Set([
    "help",
    ...(command.booleanFlags ?? []),
    ...(command.valueFlags ?? []),
    ...(command.repeatableValueFlags ?? []),
  ]);

  return Object.keys(parsed.flags)
    .filter((name) => !allowed.has(name))
    .sort();
}

export function rejectUnknownFlags(
  parsed: ParsedArgs,
  command: CommandModule,
): CommandResult | undefined {
  const unknownFlags = getUnknownFlags(parsed, command);
  if (unknownFlags.length === 0) {
    return undefined;
  }

  const formatted = unknownFlags.map((name) => `--${name}`).join(", ");
  const suffix = unknownFlags.length === 1 ? "" : "s";
  return {
    code: 1,
    stderr: `${command.name}: unknown flag${suffix} ${formatted}`,
  };
}

export function looksLikeLocalPath(reference: string): boolean {
  return reference.startsWith("./") || reference.startsWith("../") || reference.startsWith("/");
}

export function isInvalidReference(reference: string): boolean {
  return /\s/.test(reference);
}

export function isRegistryFailure(reference: string): boolean {
  return reference.includes("nonexistent.registry.invalid");
}

export interface DetectedEntry {
  path: string;
  name: string;
}

/**
 * Auto-detect stax entry files in the given directory.
 * Search order:
 *   1. .stax/[name]/agent.ts or package.ts
 *
 * Returns all found entries. When exactly one is found, callers can use it directly.
 * When multiple are found, callers should ask the user to pick one.
 */
export function detectEntries(cwd: string): DetectedEntry[] {
  const entries: DetectedEntry[] = [];

  // 1. Scan .stax/*/
  const staxDir = join(cwd, ".stax");
  if (existsSync(staxDir)) {
    try {
      for (const name of readdirSync(staxDir)) {
        if (name === "artifacts" || name === "cache") continue;
        const dir = join(staxDir, name);
        if (!statSync(dir).isDirectory()) continue;
        for (const candidate of ["agent.ts", "package.ts"]) {
          const p = join(dir, candidate);
          if (existsSync(p)) {
            entries.push({ path: p, name });
            break;
          }
        }
      }
    } catch {
      // ignore read errors
    }
  }

  return entries;
}

/**
 * Auto-detect a single stax entry file. Returns path or undefined.
 * When multiple agents exist, returns undefined (caller must handle disambiguation).
 */
export function detectEntry(cwd: string): string | undefined {
  const entries = detectEntries(cwd);
  if (entries.length === 1) return entries[0]!.path;
  return undefined;
}
