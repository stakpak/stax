import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { inspect as ociInspect } from "@stax/oci";

import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  looksLikeLocalPath,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const inspectCommand: CommandModule = {
  name: "inspect",
  summary: "Inspect artifact metadata and layers",
  usage: "stax inspect <reference> [--json]",
  booleanFlags: ["json"],
  async run(args) {
    const parsed = parseArgs(args, inspectCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(inspectCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, inspectCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "inspect: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `inspect: invalid reference '${reference}'` };
    }

    // Local artifact inspection
    if (looksLikeLocalPath(reference)) {
      const artifactDir = resolve(reference);
      const manifestPath = join(artifactDir, "manifest.json");

      if (!existsSync(manifestPath)) {
        return { code: 2, stderr: `inspect: no manifest found at ${artifactDir}` };
      }

      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        const configDigest = manifest.config?.digest;
        let config: Record<string, unknown> = {};

        if (configDigest) {
          const blobPath = join(
            artifactDir,
            "blobs",
            "sha256",
            configDigest.replace("sha256:", ""),
          );
          if (existsSync(blobPath)) {
            config = JSON.parse(readFileSync(blobPath, "utf-8"));
          }
        }

        if (hasFlag(parsed, "json")) {
          return { code: 0, stdout: JSON.stringify({ manifest, config }, null, 2) };
        }

        const lines = [
          `Artifact: ${(config.name as string) ?? "unknown"}@${(config.version as string) ?? "unknown"}`,
          `  type: ${manifest.artifactType ?? "unknown"}`,
          `  layers: ${manifest.layers?.length ?? 0}`,
        ];

        for (const layer of manifest.layers ?? []) {
          lines.push(`    ${layer.mediaType} (${layer.size} bytes) ${layer.digest}`);
        }

        return { code: 0, stdout: lines.join("\n") };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { code: 2, stderr: `inspect: failed to read local artifact: ${message}` };
      }
    }

    // Remote artifact inspection
    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `inspect: failed to reach registry for ${reference}` };
    }

    try {
      const result = await ociInspect(reference);

      if (hasFlag(parsed, "json")) {
        return { code: 0, stdout: JSON.stringify(result, null, 2) };
      }

      const lines = [
        `Artifact: ${result.name}@${result.version}`,
        `  type: ${result.artifactType}`,
        `  layers: ${result.layers.length}`,
        `  total size: ${result.totalSize} bytes`,
      ];

      for (const layer of result.layers) {
        lines.push(`    ${layer.mediaType} (${layer.size} bytes) ${layer.digest}`);
      }

      return { code: 0, stdout: lines.join("\n") };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `inspect: ${message}` };
    }
  },
};
