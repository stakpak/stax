import {
  KNOWN_ADAPTERS,
  getStringFlag,
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const planInstallCommand: CommandModule = {
  name: "plan-install",
  summary: "Preview an install plan without applying changes",
  usage: "stax plan-install <reference> [--consumer <name>] [--json]",
  valueFlags: ["consumer"],
  run(args) {
    const parsed = parseArgs(args, planInstallCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(planInstallCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "plan-install: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `plan-install: invalid reference '${reference}'` };
    }

    const consumer = getStringFlag(parsed, "consumer");
    if (consumer && !KNOWN_ADAPTERS.has(consumer)) {
      return { code: 5, stderr: `plan-install: unsupported consumer '${consumer}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `plan-install: failed to reach registry for ${reference}` };
    }

    return { code: 3, stderr: `plan-install: remote artifact unavailable: ${reference}` };
  },
};
