import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const pushCommand: CommandModule = {
  name: "push",
  summary: "Push a built artifact to a registry",
  usage: "stax push [--all-personas] <reference>",
  run(args) {
    const parsed = parseArgs(args, pushCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(pushCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "push: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `push: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `push: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `push: no publishable artifact available for ${reference}` };
  },
};
