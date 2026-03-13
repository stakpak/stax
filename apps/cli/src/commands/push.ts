import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { push as ociPush } from "@stax/oci";

import {
  hasFlag,
  isInvalidReference,
  isRegistryFailure,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

export const pushCommand: CommandModule = {
  name: "push",
  summary: "Push a built artifact to a registry",
  usage: "stax push <reference>",
  async run(args) {
    const parsed = parseArgs(args, pushCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(pushCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, pushCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "push: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `push: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `push: failed to reach registry for ${reference}` };
    }

    // Look for local artifact in .stax/artifacts
    const artifactDir = join(process.cwd(), ".stax", "artifacts");
    const manifestPath = join(artifactDir, "manifest.json");

    if (!existsSync(manifestPath)) {
      return {
        code: 3,
        stderr: `push: no publishable artifact found. Run 'stax build' first.`,
      };
    }

    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const blobs = new Map<string, Uint8Array>();

      // Load all blobs
      const blobsDir = join(artifactDir, "blobs", "sha256");
      if (existsSync(blobsDir)) {
        for (const file of readdirSync(blobsDir)) {
          const digest = `sha256:${file}`;
          blobs.set(digest, readFileSync(join(blobsDir, file)));
        }
      }

      const digest = await ociPush(reference, manifest, blobs);
      return {
        code: 0,
        stdout: `Pushed ${reference}\n  digest: ${digest}`,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `push: ${message}` };
    }
  },
};
