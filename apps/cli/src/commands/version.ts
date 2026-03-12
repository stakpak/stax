import { VERSION, hasFlag, parseArgs, renderCommandHelp } from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const versionCommand: CommandModule = {
  name: "version",
  summary: "Show version",
  usage: "stax version",
  run(args) {
    const parsed = parseArgs(args, versionCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(versionCommand) };
    }

    return { code: 0, stdout: `stax ${VERSION}` };
  },
};
