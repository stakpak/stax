import { resolve } from "node:path";

import { build } from "@stax/build";

import {
  detectEntries,
  getStringFlag,
  hasFlag,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const buildCommand: CommandModule = {
  name: "build",
  summary: "Build a stax artifact from local definitions",
  usage: "stax build [entry] [--persona <name>] [--all-personas] [--symlink-mode <reject|flatten>]",
  booleanFlags: ["all-personas"],
  valueFlags: ["persona", "symlink-mode"],
  async run(args) {
    const parsed = parseArgs(args, buildCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(buildCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, buildCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    if (hasFlag(parsed, "persona") && hasFlag(parsed, "all-personas")) {
      return { code: 1, stderr: "build: --persona and --all-personas cannot be used together" };
    }

    const symlinkMode = getStringFlag(parsed, "symlink-mode");
    if (symlinkMode && symlinkMode !== "reject" && symlinkMode !== "flatten") {
      return { code: 1, stderr: `build: invalid --symlink-mode '${symlinkMode}'` };
    }

    const cwd = process.cwd();
    let entry: string | undefined;

    if (parsed.positionals[0]) {
      entry = resolve(parsed.positionals[0]);
    } else {
      const entries = detectEntries(cwd);
      if (entries.length === 1) {
        entry = entries[0]!.path;
      } else if (entries.length > 1) {
        const names = entries.map((e) => e.name).join(", ");
        return {
          code: 2,
          stderr: `build: multiple agents found: ${names}\nSpecify which one: stax build .stax/<name>/agent.ts`,
        };
      }
    }

    if (!entry) {
      return {
        code: 2,
        stderr: `build: no buildable stax entry found in ${cwd}\nExpected .stax/<name>/agent.ts or .stax/<name>/package.ts`,
      };
    }

    try {
      const result = await build({
        entry,
        persona: getStringFlag(parsed, "persona"),
        allPersonas: hasFlag(parsed, "all-personas"),
        symlinkMode: (symlinkMode as "reject" | "flatten") ?? undefined,
      });

      const lines = [
        `Built artifact: ${result.digest}`,
        `  path: ${result.artifactPath}`,
        `  layers: ${result.layers.length}`,
      ];

      for (const layer of result.layers) {
        lines.push(`    ${layer.mediaType} (${layer.size} bytes)`);
      }

      if (result.warnings.length > 0) {
        lines.push("");
        lines.push("Warnings:");
        for (const w of result.warnings) {
          lines.push(`  - ${w}`);
        }
      }

      return { code: 0, stdout: lines.join("\n") };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 2, stderr: `build: ${message}` };
    }
  },
};
