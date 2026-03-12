import { existsSync, statSync } from "node:fs";

import { hasFlag, parseArgs, renderCommandHelp } from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const validateCommand: CommandModule = {
  name: "validate",
  summary: "Validate local definitions without building",
  usage: "stax validate [entry]",
  run(args) {
    const parsed = parseArgs(args, validateCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(validateCommand) };
    }

    const entry = parsed.positionals[0];
    if (entry && existsSync(entry) && statSync(entry).isDirectory()) {
      return {
        code: 1,
        stderr: `validate: expected a file entry, received directory '${entry}'`,
      };
    }

    return {
      code: 1,
      stderr: `validate: no valid stax definition found in ${process.cwd()}`,
    };
  },
};
