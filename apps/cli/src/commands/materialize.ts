import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { applyMaterialization, planInstall, renderMaterialization } from "@stax/materialize";

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

export const materializeCommand: CommandModule = {
  name: "materialize",
  summary: "Translate an artifact into runtime-native output",
  usage:
    "stax materialize <reference> [--adapter <name>] [--out <dir>] [--json] [--plan] [--consumer <name>] [--exact]",
  booleanFlags: ["json", "plan", "exact"],
  valueFlags: ["adapter", "consumer", "out"],
  async run(args) {
    const parsed = parseArgs(args, materializeCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(materializeCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, materializeCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "materialize: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `materialize: invalid reference '${reference}'` };
    }

    const adapter = getStringFlag(parsed, "adapter") ?? getStringFlag(parsed, "consumer");
    if (adapter && !KNOWN_ADAPTERS.has(adapter)) {
      return { code: 5, stderr: `materialize: unsupported adapter '${adapter}'` };
    }

    if (hasFlag(parsed, "exact") && adapter === "generic") {
      return { code: 5, stderr: "materialize: adapter 'generic' does not support exact mode" };
    }

    const source = looksLikeLocalPath(reference) ? resolve(reference) : reference;

    if (looksLikeLocalPath(reference) && !existsSync(source)) {
      return { code: 2, stderr: `materialize: local artifact not found: ${reference}` };
    }

    if (!looksLikeLocalPath(reference) && isRegistryFailure(reference)) {
      return { code: 3, stderr: `materialize: failed to reach registry for ${reference}` };
    }

    const outDir = getStringFlag(parsed, "out") ?? process.cwd();

    try {
      if (hasFlag(parsed, "plan")) {
        const plan = await planInstall(source, adapter ?? "claude-code", {
          outDir,
          exact: hasFlag(parsed, "exact"),
        });

        if (hasFlag(parsed, "json")) {
          return {
            code: 0,
            stdout: JSON.stringify(
              {
                adapter: plan.selectedAdapter ?? adapter ?? "claude-code",
                fidelity: plan.fidelity ?? "best-effort",
                lossy: plan.lossy ?? false,
                warnings: plan.warnings,
                actions: plan.actions,
                compatibility: {
                  exactRequested: hasFlag(parsed, "exact"),
                  exactSatisfied: hasFlag(parsed, "exact")
                    ? (plan.lossy ?? false) === false
                    : undefined,
                },
              },
              null,
              2,
            ),
          };
        }

        const lines = [
          `Materialization plan for ${reference}`,
          `  adapter: ${plan.selectedAdapter ?? adapter ?? "claude-code"}`,
          `  fidelity: ${plan.fidelity ?? "best-effort"}`,
          `  lossy: ${plan.lossy ?? false}`,
          "",
          "Actions:",
        ];

        for (const action of plan.actions) {
          lines.push(`  [${action.kind}] ${action.path}`);
        }

        if (plan.warnings.length > 0) {
          lines.push("", "Warnings:");
          for (const warning of plan.warnings) {
            lines.push(`  [${warning.code}] ${warning.message}`);
          }
        }

        return { code: 0, stdout: lines.join("\n") };
      }

      const rendered = await renderMaterialization({
        source,
        outDir,
        adapter,
        exact: hasFlag(parsed, "exact"),
      });
      const applied = await applyMaterialization(rendered, outDir);

      if (hasFlag(parsed, "json")) {
        return {
          code: 0,
          stdout: JSON.stringify(
            {
              name: rendered.agent.config.name,
              version: rendered.agent.config.version,
              adapter: rendered.adapter.type,
              targets: rendered.adapter.targets ?? [],
              fidelity: rendered.fidelity,
              lossy: rendered.lossy,
              warnings: rendered.warnings,
              provenance: rendered.agent.config.adapterFallback ?? [],
              files: applied.written,
              outputDir: applied.outDir,
            },
            null,
            2,
          ),
        };
      }

      const lines = [
        `Materialized ${rendered.agent.config.name}@${rendered.agent.config.version}`,
        `  adapter: ${rendered.adapter.type}`,
        `  fidelity: ${rendered.fidelity}`,
        `  files written: ${applied.written.length}`,
        `  output: ${applied.outDir}`,
      ];

      if (rendered.warnings.length > 0) {
        lines.push("", "Warnings:");
        for (const warning of rendered.warnings) {
          lines.push(`  [${warning.code}] ${warning.message}`);
        }
      }

      return { code: 0, stdout: lines.join("\n") };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `materialize: ${message}` };
    }
  },
};
