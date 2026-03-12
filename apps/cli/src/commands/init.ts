import {
  KNOWN_TEMPLATES,
  getStringFlag,
  hasFlag,
  parseArgs,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const initCommand: CommandModule = {
  name: "init",
  summary: "Scaffold a new agent or package project",
  usage: "stax init [--agent | --package] [--template <name>]",
  valueFlags: ["template"],
  run(args) {
    const parsed = parseArgs(args, initCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(initCommand) };
    }

    if (hasFlag(parsed, "agent") && hasFlag(parsed, "package")) {
      return { code: 1, stderr: "init: --agent and --package cannot be used together" };
    }

    const template = getStringFlag(parsed, "template");
    if (template && !KNOWN_TEMPLATES.has(template)) {
      return { code: 1, stderr: `init: unknown template '${template}'` };
    }

    const kind = hasFlag(parsed, "package") ? "package" : "agent";
    const suffix = template ? ` using template ${template}` : "";

    return {
      code: 0,
      stdout: `Initialized ${kind}${suffix}. Scaffolded ${kind}.ts`,
    };
  },
};
