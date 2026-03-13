import { z } from "zod";
import { NAME_REGEX, SEMVER_REGEX } from "../validation.ts";

const adapterFeatureMapSchema = z
  .object({
    prompt: z.enum(["native", "embedded", "unsupported"]).optional(),
    persona: z.enum(["native", "embedded", "unsupported"]).optional(),
    rules: z.enum(["native", "embedded", "translated", "unsupported"]).optional(),
    skills: z.enum(["native", "translated", "unsupported"]).optional(),
    mcp: z.enum(["native", "translated", "unsupported"]).optional(),
    surfaces: z.enum(["native", "embedded", "translated", "unsupported"]).optional(),
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

const adapterConfigSchema = z.object({
  type: z.string().min(1),
  runtime: z.string().min(1),
  adapterVersion: z.string().regex(SEMVER_REGEX, "Must be valid semver"),
  runtimeVersionRange: z.string().optional(),
  model: z.string().optional(),
  modelParams: z.record(z.string(), z.unknown()).optional(),
  importMode: z.enum(["filesystem", "api", "bundle", "object-map"]).optional(),
  fidelity: z.enum(["byte-exact", "schema-exact", "best-effort", "unsupported"]).optional(),
  config: z.record(z.string(), z.unknown()),
  features: adapterFeatureMapSchema,
  targets: z.array(materializationTargetSchema).optional(),
});

const secretDeclarationSchema = z.object({
  key: z.string().min(1),
  required: z.boolean(),
  description: z.string().optional(),
  kind: z
    .enum(["api-key", "token", "password", "certificate", "connection-string", "url", "opaque"])
    .optional(),
  exposeAs: z
    .object({
      env: z.string().optional(),
      file: z.string().optional(),
    })
    .optional(),
});

const workspaceSourceSchema = z.object({
  id: z.string().min(1),
  ref: z.string().min(1),
  mountPath: z.string().min(1),
  writable: z.boolean().optional(),
  required: z.boolean().optional(),
  subpath: z.string().optional(),
});

export const agentSchema = z
  .object({
    specVersion: z.string().optional(),
    name: z.string().regex(NAME_REGEX, "Name must match ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$"),
    version: z.string().regex(SEMVER_REGEX, "Must be valid semver"),
    description: z.string().min(1),
    author: z.string().optional(),
    license: z.string().optional(),
    url: z.string().optional(),
    tags: z
      .array(z.string())
      .refine((tags) => new Set(tags).size === tags.length, { message: "Tags must be unique" })
      .optional(),
    adapter: adapterConfigSchema,
    adapterFallback: z.array(adapterConfigSchema).optional(),
    persona: z.string().optional(),
    prompt: z.string().optional(),
    mcp: z.string().optional(),
    skills: z.string().optional(),
    rules: z.string().optional(),
    knowledge: z.string().optional(),
    memory: z.string().optional(),
    surfaces: z.string().optional(),
    instructionTree: z.string().optional(),
    subagents: z.string().optional(),
    hints: z
      .object({
        isolation: z.enum(["process", "container", "gvisor", "microvm"]).optional(),
        capabilities: z
          .object({
            shell: z.boolean().optional(),
            processes: z.boolean().optional(),
            docker: z.boolean().optional(),
            network: z
              .object({
                mode: z.enum(["none", "restricted", "full"]),
                allowlist: z.array(z.string()).optional(),
              })
              .optional(),
            filesystem: z
              .object({
                workspace: z.string().optional(),
                writable: z.array(z.string()).optional(),
                denyRead: z.array(z.string()).optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .optional(),
    secrets: z.array(secretDeclarationSchema).optional(),
    workspaceSources: z
      .array(workspaceSourceSchema)
      .refine(
        (sources) => {
          const ids = sources.map((s) => s.id);
          return new Set(ids).size === ids.length;
        },
        { message: "Workspace source IDs must be unique" },
      )
      .refine(
        (sources) => {
          const paths = sources.map((s) => s.mountPath);
          return new Set(paths).size === paths.length;
        },
        { message: "Workspace source mount paths must not collide" },
      )
      .optional(),
    packages: z.array(z.string()).optional(),
  })
  .passthrough();
