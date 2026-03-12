import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const extractCommand: CommandModule = {
  name: "extract",
  summary: "Extract canonical layers for debugging",
  usage: "stax extract <reference> <output-dir>",
  run(args) {
    const parsed = parseArgs(args, extractCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(extractCommand) };
    }

    const reference = parsed.positionals[0];
    const outputDir = parsed.positionals[1];

    if (!reference) {
      return { code: 1, stderr: "extract: reference argument is required" };
    }

    if (!outputDir) {
      return { code: 1, stderr: "extract: output directory argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `extract: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `extract: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `extract: remote artifact unavailable: ${reference}` };
  },
};
