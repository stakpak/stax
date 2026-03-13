import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { inspect as ociInspect } from "@stax/oci";

import {
  hasFlag,
  isInvalidReference,
  looksLikeLocalPath,
  parseArgs,
  rejectUnknownFlags,
  renderCommandHelp,
} from "../command-helpers.ts";
import type { CommandModule } from "../command-types.ts";

interface ArtifactSummary {
  name: string;
  version: string;
  artifactType: string;
  layers: { mediaType: string; digest: string; size: number }[];
}

async function loadArtifactSummary(ref: string): Promise<ArtifactSummary> {
  if (looksLikeLocalPath(ref)) {
    const dir = resolve(ref);
    const manifestPath = join(dir, "manifest.json");
    if (!existsSync(manifestPath)) {
      throw new Error(`no manifest found at ${dir}`);
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    let name = "unknown";
    let version = "unknown";

    if (manifest.config?.digest) {
      const blobPath = join(dir, "blobs", "sha256", manifest.config.digest.replace("sha256:", ""));
      if (existsSync(blobPath)) {
        const config = JSON.parse(readFileSync(blobPath, "utf-8"));
        name = config.name ?? "unknown";
        version = config.version ?? "unknown";
      }
    }

    return {
      name,
      version,
      artifactType: manifest.artifactType ?? "unknown",
      layers: manifest.layers ?? [],
    };
  }

  const result = await ociInspect(ref);
  return {
    name: result.name,
    version: result.version,
    artifactType: result.artifactType,
    layers: result.layers,
  };
}

export const diffCommand: CommandModule = {
  name: "diff",
  summary: "Compare two artifacts or local projects",
  usage: "stax diff <left> <right>",
  async run(args) {
    const parsed = parseArgs(args, diffCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(diffCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, diffCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const left = parsed.positionals[0];
    const right = parsed.positionals[1];

    if (!left || !right) {
      return { code: 1, stderr: "diff: two arguments are required" };
    }

    if (isInvalidReference(left) || isInvalidReference(right)) {
      return { code: 1, stderr: "diff: inputs must not contain whitespace" };
    }

    try {
      const [leftSummary, rightSummary] = await Promise.all([
        loadArtifactSummary(left),
        loadArtifactSummary(right),
      ]);

      const lines: string[] = [
        `Left:  ${leftSummary.name}@${leftSummary.version} (${leftSummary.artifactType})`,
        `Right: ${rightSummary.name}@${rightSummary.version} (${rightSummary.artifactType})`,
        "",
      ];

      // Compare layers
      const leftTypes = new Set(leftSummary.layers.map((l) => l.mediaType));
      const rightTypes = new Set(rightSummary.layers.map((l) => l.mediaType));

      const allTypes = new Set([...leftTypes, ...rightTypes]);
      let hasDiff = false;

      for (const type of allTypes) {
        const leftLayer = leftSummary.layers.find((l) => l.mediaType === type);
        const rightLayer = rightSummary.layers.find((l) => l.mediaType === type);

        if (!leftLayer) {
          lines.push(`  + ${type} (added, ${rightLayer!.size} bytes)`);
          hasDiff = true;
        } else if (!rightLayer) {
          lines.push(`  - ${type} (removed, was ${leftLayer.size} bytes)`);
          hasDiff = true;
        } else if (leftLayer.digest !== rightLayer.digest) {
          lines.push(`  ~ ${type} (changed, ${leftLayer.size} → ${rightLayer.size} bytes)`);
          hasDiff = true;
        } else {
          lines.push(`  = ${type} (identical)`);
        }
      }

      if (!hasDiff) {
        lines.push("Artifacts are identical.");
      }

      return { code: 0, stdout: lines.join("\n") };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Network/fetch errors → code 3 (remote unavailable); local errors → code 2
      const isLocal = looksLikeLocalPath(left) && looksLikeLocalPath(right);
      return { code: isLocal ? 2 : 3, stderr: `diff: ${message}` };
    }
  },
};
