import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const pullCommand: CommandModule = {
  name: "pull",
  summary: "Pull an artifact into the local cache",
  usage: "stax pull <reference>",
  run(args) {
    const parsed = parseArgs(args, pullCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(pullCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "pull: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `pull: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `pull: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `pull: remote artifact unavailable: ${reference}` };
  },
};
