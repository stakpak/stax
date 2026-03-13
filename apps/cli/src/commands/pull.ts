import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { pull as ociPull } from "@stax/oci";

import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const pullCommand: CommandModule = {
  name: "pull",
  summary: "Pull an artifact into the local cache",
  usage: "stax pull <reference>",
  async run(args) {
    const parsed = parseArgs(args, pullCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(pullCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, pullCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "pull: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `pull: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `pull: failed to reach registry for ${reference}` };
    }

    try {
      const result = await ociPull(reference);

      // Store in local cache
      const cacheDir = join(process.cwd(), ".stax", "cache");
      const blobsDir = join(cacheDir, "blobs", "sha256");
      mkdirSync(blobsDir, { recursive: true });

      writeFileSync(join(cacheDir, "manifest.json"), JSON.stringify(result.manifest, null, 2));

      for (const [digest, data] of result.blobs) {
        const hash = digest.replace("sha256:", "");
        writeFileSync(join(blobsDir, hash), data);
      }

      return {
        code: 0,
        stdout: `Pulled ${reference}\n  layers: ${result.manifest.layers.length}\n  cached: ${cacheDir}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `pull: ${message}` };
    }
  },
};
