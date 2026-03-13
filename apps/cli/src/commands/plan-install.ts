import { resolve } from "node:path";

import { planInstall } from "@stax/materialize";

import {
  KNOWN_ADAPTERS,
  getStringFlag,
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  looksLikeLocalPath,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const planInstallCommand: CommandModule = {
  name: "plan-install",
  summary: "Preview an install plan without applying changes",
  usage: "stax plan-install <reference> [--consumer <name>] [--json] [--exact]",
  booleanFlags: ["json", "exact"],
  valueFlags: ["consumer"],
  async run(args) {
    const parsed = parseArgs(args, planInstallCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(planInstallCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, planInstallCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
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

    const source = looksLikeLocalPath(reference) ? resolve(reference) : reference;
    const adapter = consumer ?? "claude-code";

    try {
      const plan = await planInstall(source, adapter, { exact: hasFlag(parsed, "exact") });
      const jsonSummary = {
        adapter: plan.selectedAdapter ?? adapter,
        selectedAdapter: plan.selectedAdapter ?? adapter,
        fidelity: plan.fidelity ?? "best-effort",
        lossy: plan.lossy ?? false,
        warnings: plan.warnings,
        actions: plan.actions,
        compatibility: {
          exactRequested: hasFlag(parsed, "exact"),
          exactSatisfied: hasFlag(parsed, "exact") ? (plan.lossy ?? false) === false : undefined,
        },
      };

      if (hasFlag(parsed, "json")) {
        return { code: 0, stdout: JSON.stringify(jsonSummary, null, 2) };
      }

      const lines = [
        `Install plan for ${reference}`,
        `  adapter: ${jsonSummary.adapter}`,
        `  fidelity: ${jsonSummary.fidelity}`,
        `  lossy: ${jsonSummary.lossy}`,
        "",
        "Actions:",
      ];

      for (const action of plan.actions) {
        lines.push(`  [${action.kind}] ${action.path}`);
        lines.push(`    ${action.description}`);
      }

      if (plan.warnings.length > 0) {
        lines.push("", "Warnings:");
        for (const warning of plan.warnings) {
          lines.push(`  [${warning.code}] ${warning.message}`);
        }
      }

      return { code: 0, stdout: lines.join("\n") };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `plan-install: ${message}` };
    }
  },
};
