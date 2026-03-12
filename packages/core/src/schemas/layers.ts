import { z } from "zod";

export const ruleSchema = z.object({
  id: z.string().optional(),
  scope: z.enum(["always", "glob", "auto", "manual"]),
  globs: z.array(z.string()).optional(),
  priority: z.number().optional(),
  severity: z.enum(["info", "warn", "error"]).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  content: z.string(),
});

export const skillSchema = z.object({
  name: z.string(),
  description: z.string(),
  allowedTools: z.array(z.string()).optional(),
  model: z.string().optional(),
  userInvocable: z.boolean().optional(),
  argumentHint: z.string().optional(),
  priority: z.number().optional(),
  tags: z.array(z.string()).optional(),
  content: z.string(),
});

export const surfaceDefinitionSchema = z.object({
  instructions: z.string().optional(),
  persona: z.string().optional(),
  tools: z.string().optional(),
  identity: z.string().optional(),
  user: z.string().optional(),
  heartbeat: z.string().optional(),
  bootstrap: z.string().optional(),
});

export const instructionTreeNodeSchema = z.object({
  instructions: z.string(),
});

export const instructionTreeSchema = z.record(z.string(), instructionTreeNodeSchema.optional());

export const knowledgeManifestSchema = z.object({
  specVersion: z.string(),
  files: z.record(
    z.string(),
    z.object({
      title: z.string().optional(),
      tags: z.array(z.string()).optional(),
      source: z.string().optional(),
      chunkHint: z.string().optional(),
    }),
  ),
});

export const memoryMetaSchema = z.object({
  specVersion: z.string(),
  snapshotId: z.string(),
  scope: z.object({
    type: z.enum(["agent", "user", "workspace", "project", "session"]),
    id: z.string(),
  }),
  sourceArtifact: z.string(),
  parentSnapshot: z.string().nullable(),
  createdAt: z.string(),
});
