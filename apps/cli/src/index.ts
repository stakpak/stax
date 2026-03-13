import { VERSION, renderRootHelp } from "./command-helpers.ts";
import type { CommandResult } from "./command-types.ts";
import { commands, getCommand } from "./commands/index.ts";

function printResult(result: CommandResult): never {
  if (result.stdout) {
    console.log(result.stdout);
  }

  if (result.stderr) {
    console.error(result.stderr);
  }

  process.exit(result.code);
}

async function main(): Promise<never> {
  const args = process.argv.slice(2);
  const commandName = args[0];

  if (args.length === 0 || commandName === "--help" || commandName === "-h") {
    printResult({ code: 0, stdout: renderRootHelp(commands) });
  }

  if (commandName === "--version" || commandName === "-V") {
    printResult({ code: 0, stdout: `stax ${VERSION}` });
  }

  const command = commandName ? getCommand(commandName) : undefined;

  if (!commandName || !command) {
    printResult({ code: 1, stderr: `Unknown command: ${commandName ?? ""}`.trim() });
  }

  const result = await command.run(args.slice(1));
  printResult(result);
}

main();
