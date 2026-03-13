import { existsSync } from "node:fs";
import { basename, join } from "node:path";

import * as p from "@clack/prompts";
import type { DetectionResult } from "@stax/core";

import {
  KNOWN_ADAPTERS,
  KNOWN_TEMPLATES,
  getStringFlag,
  hasFlag,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";
import { ADAPTER_HINTS, getAdapterDetect, INIT_ADAPTERS } from "./init/adapters.ts";
import { formatDetectionSummary } from "./init/detection-import.ts";
import { scaffoldFiles } from "./init/scaffold.ts";

function sanitizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-|-$/g, "");
}

function defaultProjectName(cwd: string): string {
  return sanitizeName(basename(cwd)) || "my-agent";
}

function existingTargetPath(cwd: string, name: string): string {
  return join(cwd, ".stax", name);
}

function targetAlreadyExists(cwd: string, name: string): boolean {
  const targetDir = existingTargetPath(cwd, name);
  return existsSync(join(targetDir, "agent.ts")) || existsSync(join(targetDir, "package.ts"));
}

async function maybeDetectExistingConfig(
  cwd: string,
  kind: "agent" | "package",
  adapter: string,
  interactive: boolean,
): Promise<{ cancelled: boolean; detected?: DetectionResult }> {
  if (kind !== "agent") return { cancelled: false };

  const detectFn = getAdapterDetect(adapter);
  if (!detectFn) return { cancelled: false };

  const detected = detectFn(cwd);
  if (!detected.found) return { cancelled: false };

  if (!interactive) return { cancelled: false, detected };

  p.note(formatDetectionSummary(detected), `Detected existing ${adapter} configuration`);
  const importResult = await p.confirm({
    message: "Import detected config into new agent?",
    initialValue: true,
  });

  if (p.isCancel(importResult)) {
    p.cancel("Init cancelled.");
    return { cancelled: true };
  }

  return { cancelled: false, detected: importResult ? detected : undefined };
}

async function promptForKind(current: "agent" | "package"): Promise<"agent" | "package" | symbol> {
  return p.select({
    message: "What are you creating?",
    options: [
      { value: "agent", label: "Agent", hint: "A deployable AI agent with an adapter" },
      { value: "package", label: "Package", hint: "A reusable set of rules, skills, and prompts" },
    ],
    initialValue: current,
  });
}

async function promptForAdapter(current: string): Promise<string | symbol> {
  return p.select({
    message: "Which coding agent do you use?",
    options: INIT_ADAPTERS.map((adapter) => ({
      value: adapter,
      label: adapter,
      hint: ADAPTER_HINTS[adapter],
    })),
    initialValue: current,
  });
}

async function promptForName(cwd: string, fallback: string): Promise<string | symbol> {
  return p.text({
    message: "Agent name",
    placeholder: fallback,
    defaultValue: fallback,
    validate(value) {
      const sanitized = sanitizeName(value ?? "");
      if (!sanitized) return "Name must contain at least one alphanumeric character";
      if (sanitized.length > 63) return "Name must be 63 characters or fewer";
      if (targetAlreadyExists(cwd, sanitized)) return `Agent '${sanitized}' already exists`;
    },
  });
}

async function promptForVersion(): Promise<string | symbol> {
  return p.text({
    message: "Version",
    placeholder: "1.0.0",
    defaultValue: "1.0.0",
    validate(value) {
      if (!/^\d+\.\d+\.\d+/.test(value ?? "")) {
        return "Must be a valid semver version (e.g. 1.0.0)";
      }
    },
  });
}

async function promptForDescription(kind: "agent" | "package"): Promise<string | symbol> {
  const fallback = `A stax ${kind}`;
  return p.text({
    message: "Description",
    placeholder: fallback,
    defaultValue: fallback,
  });
}

function createdFileList(created: string[]): string {
  return created.map((entry) => `  ${entry}`).join("\n");
}

export const initCommand: CommandModule = {
  name: "init",
  summary: "Scaffold a new agent or package project",
  usage:
    "stax init [--agent | --package] [--name <name>] [--adapter <name>] [--template <name>] [--non-interactive]",
  booleanFlags: ["agent", "package", "non-interactive"],
  valueFlags: ["template", "name", "adapter"],
  async run(args) {
    const parsed = parseArgs(args, initCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(initCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, initCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    if (hasFlag(parsed, "agent") && hasFlag(parsed, "package")) {
      return { code: 1, stderr: "init: --agent and --package cannot be used together" };
    }

    const template = getStringFlag(parsed, "template");
    if (template && !KNOWN_TEMPLATES.has(template)) {
      return { code: 1, stderr: `init: unknown template '${template}'` };
    }

    const explicitAdapter = getStringFlag(parsed, "adapter");
    if (explicitAdapter && !KNOWN_ADAPTERS.has(explicitAdapter)) {
      return { code: 1, stderr: `init: unknown adapter '${explicitAdapter}'` };
    }

    const cwd = process.cwd();
    const nonInteractive = hasFlag(parsed, "non-interactive");
    const interactive = !nonInteractive && process.stdin.isTTY;

    let kind: "agent" | "package" = hasFlag(parsed, "package") ? "package" : "agent";
    let name = getStringFlag(parsed, "name") ?? defaultProjectName(cwd);
    let version = "1.0.0";
    let description = `A stax ${kind}`;
    let adapter = explicitAdapter ?? "claude-code";
    let detected: DetectionResult | undefined;

    if (targetAlreadyExists(cwd, name) && !interactive) {
      return { code: 1, stderr: `init: ${kind} '${name}' already exists in .stax/${name}/` };
    }

    if (interactive) {
      p.intro("stax init");

      if (!hasFlag(parsed, "agent") && !hasFlag(parsed, "package")) {
        const kindResult = await promptForKind(kind);
        if (p.isCancel(kindResult)) {
          p.cancel("Init cancelled.");
          return { code: 1, stderr: "" };
        }
        kind = kindResult as "agent" | "package";
        description = `A stax ${kind}`;
      }

      if (kind === "agent" && !explicitAdapter) {
        const adapterResult = await promptForAdapter(adapter);
        if (p.isCancel(adapterResult)) {
          p.cancel("Init cancelled.");
          return { code: 1, stderr: "" };
        }
        adapter = adapterResult as string;
      }

      const detectionResult = await maybeDetectExistingConfig(cwd, kind, adapter, true);
      if (detectionResult.cancelled) {
        return { code: 1, stderr: "" };
      }
      detected = detectionResult.detected;

      const nameResult = await promptForName(cwd, name);
      if (p.isCancel(nameResult)) {
        p.cancel("Init cancelled.");
        return { code: 1, stderr: "" };
      }
      name = sanitizeName(nameResult as string) || defaultProjectName(cwd);

      const versionResult = await promptForVersion();
      if (p.isCancel(versionResult)) {
        p.cancel("Init cancelled.");
        return { code: 1, stderr: "" };
      }
      version = (versionResult as string) || "1.0.0";

      const descriptionResult = await promptForDescription(kind);
      if (p.isCancel(descriptionResult)) {
        p.cancel("Init cancelled.");
        return { code: 1, stderr: "" };
      }
      description = (descriptionResult as string) || `A stax ${kind}`;

      p.log.step("Scaffolding project...");
    } else {
      detected = (await maybeDetectExistingConfig(cwd, kind, adapter, false)).detected;
    }

    const created = scaffoldFiles(cwd, kind, {
      name,
      version,
      description,
      adapter,
      detected,
    });

    const suffix = template ? ` using template ${template}` : "";
    const fileList = createdFileList(created);

    if (interactive) {
      p.note(fileList, `Created in .stax/${name}/`);
      p.outro(`${kind} "${name}" initialized${suffix}. Happy building!`);
      return { code: 0 };
    }

    const detectedMessage = detected?.found
      ? `Detected existing ${adapter} configuration.\n\n`
      : "";

    return {
      code: 0,
      stdout: `${detectedMessage}Initialized ${kind} in .stax/${name}/${suffix}\n\nCreated:\n${fileList}`,
    };
  },
};
