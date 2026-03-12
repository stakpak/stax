import { z } from "zod";

const semverRegex =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const adapterFeatureMapSchema = z
  .object({
    prompt: z.enum(["native", "embedded", "unsupported"]).optional(),
    persona: z.enum(["native", "embedded", "unsupported"]).optional(),
    rules: z.enum(["native", "embedded", "translated", "unsupported"]).optional(),
    skills: z.enum(["native", "translated", "unsupported"]).optional(),
    mcp: z.enum(["native", "translated", "unsupported"]).optional(),
    surfaces: z.enum(["native", "translated", "embedded", "unsupported"]).optional(),
    secrets: z.enum(["native", "consumer-only"]).optional(),
    toolPermissions: z.enum(["native", "translated", "unsupported"]).optional(),
    modelConfig: z.enum(["native", "translated", "unsupported"]).optional(),
    exactMode: z.boolean().optional(),
  })
  .passthrough();

const materializationTargetSchema = z.object({
  kind: z.enum(["file", "directory", "setting", "api", "bundle", "object"]),
  path: z.string(),
  description: z.string().optional(),
  scope: z
    .enum(["user", "project", "workspace", "local", "remote", "account", "organization"])
    .optional(),
  exact: z.boolean().optional(),
  mediaType: z.string().optional(),
});

export const adapterSchema = z
  .object({
    type: z.string().min(1),
    runtime: z.string().min(1),
    adapterVersion: z.string().regex(semverRegex, "Must be valid semver"),
    runtimeVersionRange: z.string().optional(),
    model: z.string().optional(),
    modelParams: z.record(z.string(), z.unknown()).optional(),
    importMode: z.enum(["filesystem", "api", "bundle", "object-map"]).optional(),
    fidelity: z.enum(["byte-exact", "schema-exact", "best-effort", "unsupported"]).optional(),
    config: z.record(z.string(), z.unknown()),
    features: adapterFeatureMapSchema,
    targets: z.array(materializationTargetSchema).optional(),
  })
  .passthrough();
