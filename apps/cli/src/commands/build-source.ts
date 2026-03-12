import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { hasFlag, parseArgs, renderCommandHelp } from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const buildSourceCommand: CommandModule = {
  name: "build-source",
  summary: "Build a source artifact from a directory tree",
  usage: "stax build-source <path> [--git-url <url>] [--commit <sha>] [--sparse <path>]...",
  valueFlags: ["git-url", "commit", "sparse"],
  repeatableValueFlags: ["sparse"],
  run(args) {
    const parsed = parseArgs(args, buildSourceCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(buildSourceCommand) };
    }

    const sourcePath = parsed.positionals[0];
    if (!sourcePath) {
      return { code: 2, stderr: "build-source: path argument is required" };
    }

    if (!existsSync(resolve(sourcePath))) {
      return { code: 2, stderr: `build-source: path not found: ${sourcePath}` };
    }

    return {
      code: 2,
      stderr: `build-source: source artifact generation is not available yet for ${sourcePath}`,
    };
  },
};
