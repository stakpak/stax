import { describe, expect, it } from "bun:test";
import { run } from "./helpers.ts";

describe("command recognition", () => {
  const specCommands = [
    "init",
    "build",
    "build-source",
    "validate",
    "materialize",
    "plan-install",
    "inspect",
    "push",
    "pull",
    "extract",
    "diff",
    "verify",
    "login",
    "version",
  ];

  for (const cmd of specCommands) {
    it(`should recognize '${cmd}' as a valid command`, async () => {
      const { stderr } = await run([cmd]);
      expect(stderr).not.toContain("Unknown command");
    });
  }
});
