import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const verifyCommand: CommandModule = {
  name: "verify",
  summary: "Verify signatures and attestations",
  usage: "stax verify <reference>",
  run(args) {
    const parsed = parseArgs(args, verifyCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(verifyCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "verify: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `verify: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `verify: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `verify: referrers unavailable for ${reference}` };
  },
};
