import type { CommandModule } from "../command-types.ts";
import { buildCommand } from "./build.ts";
import { buildSourceCommand } from "./build-source.ts";
import { diffCommand } from "./diff.ts";
import { extractCommand } from "./extract.ts";
import { initCommand } from "./init.ts";
import { inspectCommand } from "./inspect.ts";
import { loginCommand } from "./login.ts";
import { materializeCommand } from "./materialize.ts";
import { planInstallCommand } from "./plan-install.ts";
import { pullCommand } from "./pull.ts";
import { pushCommand } from "./push.ts";
import { validateCommand } from "./validate.ts";
import { verifyCommand } from "./verify.ts";
import { versionCommand } from "./version.ts";

export const commands = [
  initCommand,
  buildCommand,
  buildSourceCommand,
  validateCommand,
  materializeCommand,
  planInstallCommand,
  inspectCommand,
  pushCommand,
  pullCommand,
  extractCommand,
  diffCommand,
  verifyCommand,
  loginCommand,
  versionCommand,
] as const satisfies readonly CommandModule[];

export function getCommand(name: string): CommandModule | undefined {
  return commands.find((command) => command.name === name);
}
