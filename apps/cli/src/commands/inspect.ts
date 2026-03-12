import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const inspectCommand: CommandModule = {
  name: "inspect",
  summary: "Inspect artifact metadata and layers",
  usage: "stax inspect <reference> [--json]",
  run(args) {
    const parsed = parseArgs(args, inspectCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(inspectCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "inspect: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `inspect: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `inspect: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `inspect: remote artifact unavailable: ${reference}` };
  },
};
