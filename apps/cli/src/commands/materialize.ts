import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  KNOWN_ADAPTERS,
  getStringFlag,
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  looksLikeLocalPath,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const materializeCommand: CommandModule = {
  name: "materialize",
  summary: "Translate an artifact into runtime-native output",
  usage:
    "stax materialize <reference> [--adapter <name>] [--out <dir>] [--json] [--plan] [--consumer <name>] [--exact]",
  valueFlags: ["adapter", "consumer", "out"],
  run(args) {
    const parsed = parseArgs(args, materializeCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(materializeCommand) };
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "materialize: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `materialize: invalid reference '${reference}'` };
    }

    const adapter = getStringFlag(parsed, "adapter");
    if (adapter && !KNOWN_ADAPTERS.has(adapter)) {
      return { code: 5, stderr: `materialize: unsupported adapter '${adapter}'` };
    }

    if (looksLikeLocalPath(reference)) {
      return existsSync(resolve(reference))
        ? { code: 5, stderr: `materialize: cannot materialize local artifact '${reference}' yet` }
        : { code: 2, stderr: `materialize: local artifact not found: ${reference}` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `materialize: failed to reach registry for ${reference}` };
    }

    if (hasFlag(parsed, "exact") && adapter === "generic") {
      return { code: 5, stderr: "materialize: adapter 'generic' does not support exact mode" };
    }

    return { code: 3, stderr: `materialize: remote artifact unavailable: ${reference}` };
  },
};
