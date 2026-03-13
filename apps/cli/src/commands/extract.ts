import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { pull } from "@stax/oci";

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

export const extractCommand: CommandModule = {
  name: "extract",
  summary: "Extract canonical layers for debugging",
  usage: "stax extract <reference> <output-dir>",
  async run(args) {
    const parsed = parseArgs(args, extractCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(extractCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, extractCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    const outputDir = parsed.positionals[1];

    if (!reference) {
      return { code: 1, stderr: "extract: reference argument is required" };
    }

    if (!outputDir) {
      return { code: 1, stderr: "extract: output directory argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `extract: invalid reference '${reference}'` };
    }

    // Local artifact extraction
    if (looksLikeLocalPath(reference)) {
      const artifactDir = resolve(reference);
      const manifestPath = join(artifactDir, "manifest.json");

      if (!existsSync(manifestPath)) {
        return { code: 2, stderr: `extract: no manifest found at ${artifactDir}` };
      }

      try {
        const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
        const outPath = resolve(outputDir);
        mkdirSync(outPath, { recursive: true });

        writeFileSync(join(outPath, "manifest.json"), JSON.stringify(manifest, null, 2));

        const blobsDir = join(outPath, "blobs", "sha256");
        mkdirSync(blobsDir, { recursive: true });

        // Copy config blob
        if (manifest.config?.digest) {
          const hash = manifest.config.digest.replace("sha256:", "");
          const srcBlob = join(artifactDir, "blobs", "sha256", hash);
          if (existsSync(srcBlob)) {
            writeFileSync(join(blobsDir, hash), readFileSync(srcBlob));
          }
        }

        // Copy layer blobs
        let layerCount = 0;
        for (const layer of manifest.layers ?? []) {
          const hash = layer.digest.replace("sha256:", "");
          const srcBlob = join(artifactDir, "blobs", "sha256", hash);
          if (existsSync(srcBlob)) {
            writeFileSync(join(blobsDir, hash), readFileSync(srcBlob));
            layerCount++;
          }
        }

        return {
          code: 0,
          stdout: `Extracted ${layerCount} layers to ${outPath}`,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { code: 2, stderr: `extract: ${message}` };
      }
    }

    // Remote artifact extraction
    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `extract: failed to reach registry for ${reference}` };
    }

    try {
      const result = await pull(reference);
      const outPath = resolve(outputDir);
      mkdirSync(outPath, { recursive: true });

      writeFileSync(join(outPath, "manifest.json"), JSON.stringify(result.manifest, null, 2));

      const blobsDir = join(outPath, "blobs", "sha256");
      mkdirSync(blobsDir, { recursive: true });

      for (const [digest, data] of result.blobs) {
        const hash = digest.replace("sha256:", "");
        writeFileSync(join(blobsDir, hash), data);
      }

      return {
        code: 0,
        stdout: `Extracted ${result.blobs.size} blobs to ${outPath}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `extract: ${message}` };
    }
  },
};
