import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { validate } from "@stax/build";

import {
  detectEntries,
  hasFlag,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const validateCommand: CommandModule = {
  name: "validate",
  summary: "Validate local definitions without building",
  usage: "stax validate [entry]",
  async run(args) {
    const parsed = parseArgs(args, validateCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(validateCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, validateCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const explicit = parsed.positionals[0];
    if (explicit && existsSync(explicit) && statSync(explicit).isDirectory()) {
      return {
        code: 1,
        stderr: `validate: expected a file entry, received directory '${explicit}'`,
      };
    }

    let entry: string | undefined;
    if (explicit) {
      entry = resolve(explicit);
    } else {
      const entries = detectEntries(process.cwd());
      if (entries.length === 1) {
        entry = entries[0]!.path;
      } else if (entries.length > 1) {
        const names = entries.map((e) => e.name).join(", ");
        return {
          code: 1,
          stderr: `validate: multiple agents found: ${names}\nSpecify which one: stax validate .stax/<name>/agent.ts`,
        };
      }
    }

    if (!entry) {
      return {
        code: 1,
        stderr: `validate: no valid stax definition found in ${process.cwd()}\nExpected .stax/<name>/agent.ts or .stax/<name>/package.ts`,
      };
    }

    try {
      const result = await validate({ entry });

      const lines: string[] = [];

      if (result.errors.length > 0) {
        lines.push("Errors:");
        for (const e of result.errors) {
          lines.push(`  [${e.code}] ${e.path}: ${e.message}`);
        }
      }

      if (result.warnings.length > 0) {
        if (lines.length > 0) lines.push("");
        lines.push("Warnings:");
        for (const w of result.warnings) {
          lines.push(`  [${w.code}] ${w.path}: ${w.message}`);
        }
      }

      if (result.valid) {
        lines.unshift("Validation passed.");
      } else {
        lines.unshift("Validation failed.");
      }

      return {
        code: result.valid ? 0 : 1,
        stdout: result.valid ? lines.join("\n") : undefined,
        stderr: result.valid ? undefined : lines.join("\n"),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 1, stderr: `validate: ${message}` };
    }
  },
};
