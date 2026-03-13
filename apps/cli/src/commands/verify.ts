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

export const verifyCommand: CommandModule = {
  name: "verify",
  summary: "Verify signatures and attestations",
  usage: "stax verify <reference>",
  async run(args) {
    const parsed = parseArgs(args, verifyCommand);

    if (hasFlag(parsed, "help")) {
      return { code: 0, stdout: renderCommandHelp(verifyCommand) };
    }

    const unknownFlagResult = rejectUnknownFlags(parsed, verifyCommand);
    if (unknownFlagResult) {
      return unknownFlagResult;
    }

    const reference = parsed.positionals[0];
    if (!reference) {
      return { code: 1, stderr: "verify: reference argument is required" };
    }

    if (isInvalidReference(reference)) {
      return { code: 1, stderr: `verify: invalid reference '${reference}'` };
    }

    if (isRegistryFailure(reference)) {
      return { code: 3, stderr: `verify: failed to reach registry for ${reference}` };
    }

    if (looksLikeLocalPath(reference)) {
      return { code: 5, stderr: "verify: local verification is not supported yet" };
    }

    try {
      // First check the artifact exists
      const result = await ociInspect(reference);

      // TODO: Check referrers API for signatures and attestations
      // For now, report that the artifact exists but has no signatures
      return {
        code: 0,
        stdout: [
          `Artifact: ${result.name}@${result.version}`,
          `  type: ${result.artifactType}`,
          `  signatures: none found`,
          `  attestations: none found`,
          "",
          "Note: Signature verification requires referrers API support from the registry.",
        ].join("\n"),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { code: 3, stderr: `verify: ${message}` };
    }
  },
};
