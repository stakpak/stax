import { getStringFlag, hasFlag, parseArgs, renderCommandHelp } from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const buildCommand: CommandModule = {
  name: "build",
  summary: "Build a stax artifact from local definitions",
  usage:
    "stax build [--persona <name>] [--all-personas] [--dry-run] [--refresh-lock] [--symlink-mode <reject|flatten>]",
  valueFlags: ["persona", "symlink-mode"],
  run(args) {
    const parsed = parseArgs(args, buildCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(buildCommand) };
    }

    if (hasFlag(parsed, "persona") && hasFlag(parsed, "all-personas")) {
      return { code: 1, stderr: "build: --persona and --all-personas cannot be used together" };
    }

    const symlinkMode = getStringFlag(parsed, "symlink-mode");
    if (symlinkMode && symlinkMode !== "reject" && symlinkMode !== "flatten") {
      return { code: 1, stderr: `build: invalid --symlink-mode '${symlinkMode}'` };
    }

    return {
      code: 2,
      stderr: `build: no buildable stax entry found in ${process.cwd()}`,
    };
  },
};
