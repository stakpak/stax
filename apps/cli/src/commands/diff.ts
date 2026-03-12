import {
  hasFlag,
  isInvalidReference,
  looksLikeLocalPath,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const diffCommand: CommandModule = {
  name: "diff",
  summary: "Compare two artifacts or local projects",
  usage: "stax diff <left> <right>",
  run(args) {
    const parsed = parseArgs(args, diffCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(diffCommand) };
    }

    const left = parsed.positionals[0];
    const right = parsed.positionals[1];

    if (!left || !right) {
      return { code: 1, stderr: "diff: two arguments are required" };
    }

    if (isInvalidReference(left) || isInvalidReference(right)) {
      return { code: 1, stderr: "diff: inputs must not contain whitespace" };
    }

    if (looksLikeLocalPath(left) && looksLikeLocalPath(right)) {
      return {
        code: 2,
        stderr: `diff: local diff is not available for '${left}' and '${right}' yet`,
      };
    }

    return { code: 3, stderr: `diff: remote artifacts unavailable: ${left} vs ${right}` };
  },
};
