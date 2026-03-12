import { hasFlag, parseArgs, renderCommandHelp } from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const loginCommand: CommandModule = {
  name: "login",
  summary: "Authenticate with an OCI registry",
  usage: "stax login [--username <name>] [--password-stdin] [registry]",
  valueFlags: ["username"],
  run(args) {
    const parsed = parseArgs(args, loginCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(loginCommand) };
    }

    if (hasFlag(parsed, "password-stdin") && !hasFlag(parsed, "username")) {
      return { code: 1, stderr: "login: --password-stdin requires --username" };
    }

    const registry = parsed.positionals[0] ?? "ghcr.io";
    return { code: 3, stderr: `login: authentication failed for ${registry}` };
  },
};
