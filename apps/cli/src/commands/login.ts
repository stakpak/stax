import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

import {
  hasFlag,
  getStringFlag,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const loginCommand: CommandModule = {
  name: "login",
  summary: "Authenticate with an OCI registry",
  usage: "stax login [--username <name>] [--password-stdin] [registry]",
  booleanFlags: ["password-stdin"],
  valueFlags: ["username"],
  async run(args) {
    const parsed = parseArgs(args, loginCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(loginCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, loginCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    if (hasFlag(parsed, "password-stdin") && !hasFlag(parsed, "username")) {
      return { code: 1, stderr: "login: --password-stdin requires --username" };
    }

    const registry = parsed.positionals[0] ?? "ghcr.io";
    const username = getStringFlag(parsed, "username");

    if (!username) {
      return { code: 1, stderr: "login: --username is required" };
    }

    let password = "";
    if (hasFlag(parsed, "password-stdin")) {
      try {
        password = readFileSync("/dev/stdin", "utf-8").trim();
      } catch {
        return { code: 1, stderr: "login: failed to read password from stdin" };
      }
    }

    if (!password) {
      return { code: 1, stderr: "login: password is required (use --password-stdin)" };
    }

    // Store credentials
    const configDir = join(homedir(), ".stax");
    mkdirSync(configDir, { recursive: true });

    const authFile = join(configDir, "auth.json");
    let auths: Record<string, { auth: string }> = {};

    if (existsSync(authFile)) {
      try {
        auths = JSON.parse(readFileSync(authFile, "utf-8"));
      } catch {
        // ignore corrupt file
      }
    }

    const token = Buffer.from(`${username}:${password}`).toString("base64");
    auths[registry] = { auth: token };
    writeFileSync(authFile, JSON.stringify(auths, null, 2));

    return {
      code: 0,
      stdout: `Login succeeded for ${registry}`,
    };
  },
};
